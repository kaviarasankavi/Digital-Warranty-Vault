import { getNeo4jSession } from '../config/database';
import { logger } from '../utils/logger';
import { VerificationRequest } from '../models/VerificationRequest';
import { WarrantyCertificate } from '../models/WarrantyCertificate';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface VerificationRequestGraphData {
    requestId:    string;   // MongoDB _id
    userId:       string;
    userName:     string;
    userEmail:    string;
    productId:    number;
    productName:  string;
    brand:        string;
    serialNumber: string;
    vendorEmail:  string;
    requestedAt:  Date;
}

export interface CertificateGraphData {
    certificateId:         string;
    verificationRequestId: string;
    productId:             number;
    serialNumber:          string;
    userId:                string;
    vendorEmail:           string;
    issuedAt:              Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper — run a Cypher query safely (non-blocking wrapper)
// ─────────────────────────────────────────────────────────────────────────────

async function runCypher(
    query: string,
    params: Record<string, unknown> = {}
): Promise<void> {
    const session = getNeo4jSession();
    if (!session) {
        logger.warn('[Neo4j] Session unavailable — graph write skipped');
        return;
    }
    try {
        await session.run(query, params);
    } finally {
        await session.close();
    }
}

async function readCypher(
    query: string,
    params: Record<string, unknown> = {}
): Promise<any[]> {
    const session = getNeo4jSession();
    if (!session) {
        logger.warn('[Neo4j] Session unavailable — graph read skipped');
        return [];
    }
    try {
        const result = await session.run(query, params);
        return result.records;
    } finally {
        await session.close();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Clear all graph data (run once on server startup)
// ─────────────────────────────────────────────────────────────────────────────

export async function clearAllGraphData(): Promise<void> {
    try {
        await runCypher('MATCH (n) DETACH DELETE n');
        logger.info('[Neo4j] All graph data cleared');
    } catch (err) {
        logger.error('[Neo4j] Failed to clear graph data:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Create nodes + relationships when a verification request is submitted
//    (:User)-[:REQUESTED_VERIFICATION]->(:VerificationRequest)
//    (:VerificationRequest)-[:FOR_PRODUCT]->(:Product)
//    (:VerificationRequest)-[:SENT_TO]->(:Vendor)
// ─────────────────────────────────────────────────────────────────────────────

export async function createVerificationRequestNode(
    data: VerificationRequestGraphData
): Promise<void> {
    const cypher = `
        MERGE (u:User { userId: $userId })
            ON CREATE SET u.name = $userName, u.email = $userEmail
            ON MATCH  SET u.name = $userName, u.email = $userEmail

        MERGE (p:Product { productId: $productId })
            ON CREATE SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber
            ON MATCH  SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber

        MERGE (v:Vendor { email: $vendorEmail })
            ON CREATE SET v.brand = $brand

        CREATE (vr:VerificationRequest {
            requestId:    $requestId,
            status:       'pending',
            requestedAt:  datetime($requestedAt),
            productName:  $productName,
            brand:        $brand,
            serialNumber: $serialNumber
        })

        CREATE (u)-[:REQUESTED_VERIFICATION { requestedAt: datetime($requestedAt) }]->(vr)
        CREATE (vr)-[:FOR_PRODUCT]->(p)
        CREATE (vr)-[:SENT_TO]->(v)
    `;

    try {
        await runCypher(cypher, {
            ...data,
            requestedAt: data.requestedAt.toISOString(),
        });
        logger.info(`[Neo4j] VerificationRequest node created: ${data.requestId}`);
    } catch (err) {
        logger.error('[Neo4j] createVerificationRequestNode failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mark a verification request as VERIFIED
//    (:Vendor)-[:VERIFIED]->(:VerificationRequest)
//    Update (:VerificationRequest).status = 'verified'
// ─────────────────────────────────────────────────────────────────────────────

export async function markVerificationVerified(
    requestId:  string,
    vendorNote: string,
    verifiedAt: Date
): Promise<void> {
    const cypher = `
        MATCH (vr:VerificationRequest { requestId: $requestId })
        MATCH (vr)-[:SENT_TO]->(v:Vendor)
        SET vr.status = 'verified', vr.verifiedAt = datetime($verifiedAt), vr.vendorNote = $vendorNote
        CREATE (v)-[:VERIFIED { verifiedAt: datetime($verifiedAt), note: $vendorNote }]->(vr)
    `;

    try {
        await runCypher(cypher, {
            requestId,
            vendorNote,
            verifiedAt: verifiedAt.toISOString(),
        });
        logger.info(`[Neo4j] VerificationRequest marked verified: ${requestId}`);
    } catch (err) {
        logger.error('[Neo4j] markVerificationVerified failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Mark a verification request as REJECTED
//    (:Vendor)-[:REJECTED]->(:VerificationRequest)
// ─────────────────────────────────────────────────────────────────────────────

export async function markVerificationRejected(
    requestId:  string,
    vendorNote: string,
    rejectedAt: Date
): Promise<void> {
    const cypher = `
        MATCH (vr:VerificationRequest { requestId: $requestId })
        MATCH (vr)-[:SENT_TO]->(v:Vendor)
        SET vr.status = 'rejected', vr.rejectedAt = datetime($rejectedAt), vr.vendorNote = $vendorNote
        CREATE (v)-[:REJECTED { rejectedAt: datetime($rejectedAt), note: $vendorNote }]->(vr)
    `;

    try {
        await runCypher(cypher, {
            requestId,
            vendorNote,
            rejectedAt: rejectedAt.toISOString(),
        });
        logger.info(`[Neo4j] VerificationRequest marked rejected: ${requestId}`);
    } catch (err) {
        logger.error('[Neo4j] markVerificationRejected failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Create a Certificate node and link it to the VerificationRequest
//    (:VerificationRequest)-[:RESULTED_IN]->(:Certificate)
// ─────────────────────────────────────────────────────────────────────────────

export async function createCertificateNode(
    data: CertificateGraphData
): Promise<void> {
    const cypher = `
        MATCH (vr:VerificationRequest { requestId: $verificationRequestId })
        MATCH (u:User { userId: $userId })
        CREATE (cert:Certificate {
            certificateId: $certificateId,
            issuedAt:      datetime($issuedAt),
            isValid:       true
        })
        CREATE (vr)-[:RESULTED_IN { issuedAt: datetime($issuedAt) }]->(cert)
        CREATE (u)-[:HOLDS_CERTIFICATE]->(cert)
    `;

    try {
        await runCypher(cypher, {
            ...data,
            issuedAt: data.issuedAt.toISOString(),
        });
        logger.info(`[Neo4j] Certificate node created: ${data.certificateId}`);
    } catch (err) {
        logger.error('[Neo4j] createCertificateNode failed:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Get the full authenticity audit trail for a serial number
// ─────────────────────────────────────────────────────────────────────────────

export interface AuditTrailResult {
    user:               { userId: string; name: string; email: string } | null;
    product:            { productId: number; name: string; brand: string; serialNumber: string } | null;
    vendor:             { email: string; brand: string } | null;
    verificationRequest: {
        requestId:   string;
        status:      string;
        requestedAt: string;
        verifiedAt:  string | null;
        rejectedAt:  string | null;
        vendorNote:  string | null;
        productName: string;
        brand:       string;
        serialNumber: string;
    } | null;
    certificate: {
        certificateId: string;
        issuedAt:      string;
        isValid:       boolean;
    } | null;
}

export async function getAuditTrailBySerial(
    serialNumber: string
): Promise<AuditTrailResult[]> {
    const cypher = `
        MATCH (vr:VerificationRequest { serialNumber: $serialNumber })
        OPTIONAL MATCH (u:User)-[:REQUESTED_VERIFICATION]->(vr)
        OPTIONAL MATCH (vr)-[:FOR_PRODUCT]->(p:Product)
        OPTIONAL MATCH (vr)-[:SENT_TO]->(v:Vendor)
        OPTIONAL MATCH (vr)-[:RESULTED_IN]->(cert:Certificate)
        RETURN u, p, v, vr, cert
        ORDER BY vr.requestedAt DESC
    `;

    try {
        const records = await readCypher(cypher, { serialNumber });

        return records.map(record => {
            const u    = record.get('u');
            const p    = record.get('p');
            const v    = record.get('v');
            const vr   = record.get('vr');
            const cert = record.get('cert');

            return {
                user: u ? {
                    userId: u.properties.userId,
                    name:   u.properties.name,
                    email:  u.properties.email,
                } : null,
                product: p ? {
                    productId:    p.properties.productId?.toNumber?.() ?? p.properties.productId,
                    name:         p.properties.name,
                    brand:        p.properties.brand,
                    serialNumber: p.properties.serialNumber,
                } : null,
                vendor: v ? {
                    email: v.properties.email,
                    brand: v.properties.brand,
                } : null,
                verificationRequest: vr ? {
                    requestId:    vr.properties.requestId,
                    status:       vr.properties.status,
                    requestedAt:  vr.properties.requestedAt?.toString() ?? null,
                    verifiedAt:   vr.properties.verifiedAt?.toString()  ?? null,
                    rejectedAt:   vr.properties.rejectedAt?.toString()  ?? null,
                    vendorNote:   vr.properties.vendorNote ?? null,
                    productName:  vr.properties.productName,
                    brand:        vr.properties.brand,
                    serialNumber: vr.properties.serialNumber,
                } : null,
                certificate: cert ? {
                    certificateId: cert.properties.certificateId,
                    issuedAt:      cert.properties.issuedAt?.toString() ?? null,
                    isValid:       cert.properties.isValid ?? true,
                } : null,
            } as AuditTrailResult;
        });
    } catch (err) {
        logger.error('[Neo4j] getAuditTrailBySerial failed:', err);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get all audit trails for a given userId
// ─────────────────────────────────────────────────────────────────────────────

export async function getAuditTrailsByUser(userId: string): Promise<AuditTrailResult[]> {
    const cypher = `
        MATCH (u:User { userId: $userId })-[:REQUESTED_VERIFICATION]->(vr:VerificationRequest)
        OPTIONAL MATCH (vr)-[:FOR_PRODUCT]->(p:Product)
        OPTIONAL MATCH (vr)-[:SENT_TO]->(v:Vendor)
        OPTIONAL MATCH (vr)-[:RESULTED_IN]->(cert:Certificate)
        RETURN u, p, v, vr, cert
        ORDER BY vr.requestedAt DESC
    `;

    try {
        const records = await readCypher(cypher, { userId });

        return records.map(record => {
            const u    = record.get('u');
            const p    = record.get('p');
            const v    = record.get('v');
            const vr   = record.get('vr');
            const cert = record.get('cert');

            return {
                user: u ? {
                    userId: u.properties.userId,
                    name:   u.properties.name,
                    email:  u.properties.email,
                } : null,
                product: p ? {
                    productId:    p.properties.productId?.toNumber?.() ?? p.properties.productId,
                    name:         p.properties.name,
                    brand:        p.properties.brand,
                    serialNumber: p.properties.serialNumber,
                } : null,
                vendor: v ? {
                    email: v.properties.email,
                    brand: v.properties.brand,
                } : null,
                verificationRequest: vr ? {
                    requestId:    vr.properties.requestId,
                    status:       vr.properties.status,
                    requestedAt:  vr.properties.requestedAt?.toString() ?? null,
                    verifiedAt:   vr.properties.verifiedAt?.toString()  ?? null,
                    rejectedAt:   vr.properties.rejectedAt?.toString()  ?? null,
                    vendorNote:   vr.properties.vendorNote ?? null,
                    productName:  vr.properties.productName,
                    brand:        vr.properties.brand,
                    serialNumber: vr.properties.serialNumber,
                } : null,
                certificate: cert ? {
                    certificateId: cert.properties.certificateId,
                    issuedAt:      cert.properties.issuedAt?.toString() ?? null,
                    isValid:       cert.properties.isValid ?? true,
                } : null,
            } as AuditTrailResult;
        });
    } catch (err) {
        logger.error('[Neo4j] getAuditTrailsByUser failed:', err);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Backfill Neo4j from MongoDB
//    Runs on server startup — reads all existing VerificationRequests and
//    Certificates from MongoDB and writes them into Neo4j.
//    Uses MERGE so it's safe to run multiple times (idempotent).
// ─────────────────────────────────────────────────────────────────────────────

export async function backfillGraphFromMongoDB(): Promise<void> {
    try {
        logger.info('[Neo4j] Starting backfill from MongoDB...');

        // ── 1. Backfill VerificationRequests ──────────────────────────────
        const requests = await VerificationRequest.find({}).lean();
        logger.info(`[Neo4j] Backfilling ${requests.length} verification request(s)...`);

        for (const req of requests) {
            const requestId = String(req._id);

            // Determine vendorEmail — resolve from brand if missing
            const vendorEmail = req.vendorEmail ?? `vendor@${req.brand?.toLowerCase()}.vault`;

            // Create base graph nodes + relationships (idempotent MERGE)
            const baseCypher = `
                MERGE (u:User { userId: $userId })
                    ON CREATE SET u.name = $userName, u.email = $userEmail
                    ON MATCH  SET u.name = $userName, u.email = $userEmail

                MERGE (p:Product { productId: $productId })
                    ON CREATE SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber
                    ON MATCH  SET p.name = $productName, p.brand = $brand, p.serialNumber = $serialNumber

                MERGE (v:Vendor { email: $vendorEmail })
                    ON CREATE SET v.brand = $brand
                    ON MATCH  SET v.brand = $brand

                MERGE (vr:VerificationRequest { requestId: $requestId })
                    ON CREATE SET
                        vr.status       = $status,
                        vr.requestedAt  = datetime($requestedAt),
                        vr.productName  = $productName,
                        vr.brand        = $brand,
                        vr.serialNumber = $serialNumber,
                        vr.vendorNote   = $vendorNote
                    ON MATCH SET
                        vr.status       = $status,
                        vr.vendorNote   = $vendorNote

                MERGE (u)-[:REQUESTED_VERIFICATION]->(vr)
                MERGE (vr)-[:FOR_PRODUCT]->(p)
                MERGE (vr)-[:SENT_TO]->(v)
            `;

            await runCypher(baseCypher, {
                userId:      req.userId,
                userName:    req.userName,
                userEmail:   req.userEmail,
                productId:   req.productId,
                productName: req.productName,
                brand:       req.brand,
                serialNumber: req.serialNumber ?? '',
                vendorEmail,
                requestId,
                status:      req.status,
                requestedAt: (req.requestedAt ?? new Date()).toISOString(),
                vendorNote:  req.vendorNote ?? '',
            });

            // Add VERIFIED / REJECTED relationship if already resolved
            if (req.status === 'verified' && req.verifiedAt) {
                const verifyCypher = `
                    MATCH (vr:VerificationRequest { requestId: $requestId })
                    MATCH (vr)-[:SENT_TO]->(v:Vendor)
                    SET vr.verifiedAt = datetime($verifiedAt)
                    MERGE (v)-[:VERIFIED { verifiedAt: datetime($verifiedAt) }]->(vr)
                `;
                await runCypher(verifyCypher, {
                    requestId,
                    verifiedAt: req.verifiedAt.toISOString(),
                });
            } else if (req.status === 'rejected' && req.verifiedAt) {
                const rejectCypher = `
                    MATCH (vr:VerificationRequest { requestId: $requestId })
                    MATCH (vr)-[:SENT_TO]->(v:Vendor)
                    SET vr.rejectedAt = datetime($rejectedAt)
                    MERGE (v)-[:REJECTED { rejectedAt: datetime($rejectedAt) }]->(vr)
                `;
                await runCypher(rejectCypher, {
                    requestId,
                    rejectedAt: req.verifiedAt.toISOString(),
                });
            }
        }

        // ── 2. Backfill Certificates ──────────────────────────────────────
        const certs = await WarrantyCertificate.find({}).lean();
        logger.info(`[Neo4j] Backfilling ${certs.length} certificate(s)...`);

        for (const cert of certs) {
            const certCypher = `
                MATCH (vr:VerificationRequest { requestId: $verificationRequestId })
                MATCH (u:User { userId: $userId })
                MERGE (c:Certificate { certificateId: $certificateId })
                    ON CREATE SET c.issuedAt = datetime($issuedAt), c.isValid = true
                MERGE (vr)-[:RESULTED_IN]->(c)
                MERGE (u)-[:HOLDS_CERTIFICATE]->(c)
            `;
            try {
                await runCypher(certCypher, {
                    verificationRequestId: String(cert.verificationRequestId),
                    userId:                cert.userId,
                    certificateId:         cert.certificateId,
                    issuedAt:              (cert.issuedAt ?? new Date()).toISOString(),
                });
            } catch (certErr) {
                // Log but continue — some certs may not have matching VerificationRequest nodes
                logger.warn(`[Neo4j] Skipped cert ${cert.certificateId}: ${certErr}`);
            }
        }

        logger.info(`[Neo4j] Backfill complete — ${requests.length} requests, ${certs.length} certificates synced`);
    } catch (err) {
        logger.error('[Neo4j] backfillGraphFromMongoDB failed:', err);
    }
}
