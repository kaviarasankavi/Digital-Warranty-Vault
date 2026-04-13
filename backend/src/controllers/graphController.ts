import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError } from '../utils/errors';
import {
    getAuditTrailBySerial,
    getAuditTrailsByUser,
    backfillGraphFromMongoDB,
} from '../services/neo4jGraphService';
import { getNeo4jSession } from '../config/database';
import { VerificationRequest } from '../models/VerificationRequest';

// ── GET /api/graph/audit-trail/:serialNumber ──────────────────────────────────
export const getAuditTrailBySerialNumber = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const serialNumber = String(req.params.serialNumber ?? '');
        if (!serialNumber || serialNumber.trim() === '') {
            throw new ValidationError('serialNumber is required');
        }
        const trail = await getAuditTrailBySerial(serialNumber.trim());
        res.json({ success: true, serialNumber, count: trail.length, data: trail });
    }
);

// ── GET /api/graph/my-trails ──────────────────────────────────────────────────
export const getMyAuditTrails = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = String(req.user!._id);
        const trails = await getAuditTrailsByUser(userId);
        res.json({ success: true, count: trails.length, data: trails });
    }
);

// ── GET /api/graph/debug ──────────────────────────────────────────────────────
// Diagnostic endpoint — shows Neo4j connection, node counts, userId, MongoDB counts
export const getGraphDebug = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const userId = String(req.user!._id);

        // ── Neo4j status ──────────────────────────────────────────────────
        let neo4jConnected = false;
        let nodeCounts: Record<string, number> = {};
        let allVrNodes: any[] = [];

        const session = getNeo4jSession();
        if (session) {
            try {
                neo4jConnected = true;

                // Count each label
                const countResult = await session.run(
                    'MATCH (n) RETURN labels(n)[0] AS label, count(n) AS cnt ORDER BY label'
                );
                countResult.records.forEach(r => {
                    nodeCounts[r.get('label')] = r.get('cnt').toNumber?.() ?? r.get('cnt');
                });

                // Get all VerificationRequest nodes (raw)
                const vrResult = await session.run(
                    'MATCH (vr:VerificationRequest) RETURN vr LIMIT 20'
                );
                allVrNodes = vrResult.records.map(r => r.get('vr').properties);

            } catch (e: any) {
                nodeCounts = { error: e.message };
            } finally {
                await session.close();
            }
        }

        // ── MongoDB counts ────────────────────────────────────────────────
        const mongoVrCount  = await VerificationRequest.countDocuments({});
        const myVrCount     = await VerificationRequest.countDocuments({ userId });

        // Sample a request to show stored userId format
        const sampleReq = await VerificationRequest.findOne({ userId }).lean();

        res.json({
            success: true,
            debug: {
                currentUserId:          userId,
                neo4jConnected,
                neo4jNodeCounts:        nodeCounts,
                neo4jAllVrNodes:        allVrNodes,
                mongoTotalVrCount:      mongoVrCount,
                mongoMyVrCount:         myVrCount,
                sampleMongoRequest: sampleReq ? {
                    _id:       String(sampleReq._id),
                    userId:    sampleReq.userId,
                    status:    sampleReq.status,
                    productName: sampleReq.productName,
                    brand:     sampleReq.brand,
                } : null,
            },
        });
    }
);

// ── POST /api/graph/backfill ──────────────────────────────────────────────────
// Manually trigger a full MongoDB → Neo4j backfill
export const triggerBackfill = asyncHandler(
    async (_req: AuthRequest, res: Response): Promise<void> => {
        await backfillGraphFromMongoDB();
        res.json({ success: true, message: 'Backfill triggered — check server logs for details.' });
    }
);
