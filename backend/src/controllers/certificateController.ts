import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthorizationError, NotFoundError } from '../utils/errors';
import { WarrantyCertificate, generateCertId } from '../models/WarrantyCertificate';
import { generateCertificatePDF } from '../services/certificateService';
import { logger } from '../utils/logger';
import { createCertificateNode } from '../services/neo4jGraphService';

// ── Automatically called from verificationController.verifyRequest ──────────
export async function issueCertificate(opts: {
    verificationRequestId: string;
    productId:    number;
    productName:  string;
    brand:        string;
    model?:       string;
    serialNumber: string;
    userId:       string;
    userName:     string;
    userEmail:    string;
    vendorEmail:  string;
    vendorNote:   string;
    verifiedAt:   Date;
}): Promise<void> {
    try {
        // Idempotent — don't issue a duplicate
        const existing = await WarrantyCertificate.findOne({
            verificationRequestId: opts.verificationRequestId,
        });
        if (existing) return;

        const cert = await WarrantyCertificate.create({
            certificateId:         generateCertId(),
            verificationRequestId: opts.verificationRequestId,
            productId:             opts.productId,
            productName:           opts.productName,
            brand:                 opts.brand,
            model:                 opts.model ?? '',
            serialNumber:          opts.serialNumber,
            userId:                opts.userId,
            userName:              opts.userName,
            userEmail:             opts.userEmail,
            vendorEmail:           opts.vendorEmail,
            vendorNote:            opts.vendorNote,
            verifiedAt:            opts.verifiedAt,
        });

        // ── Neo4j: create Certificate node + RESULTED_IN relationship ────────
        createCertificateNode({
            certificateId:         cert.certificateId,
            verificationRequestId: opts.verificationRequestId,
            productId:             opts.productId,
            serialNumber:          opts.serialNumber,
            userId:                opts.userId,
            vendorEmail:           opts.vendorEmail,
            issuedAt:              cert.issuedAt,
        });
        // ─────────────────────────────────────────────────────────────────

        logger.info(`Certificate issued for productId=${opts.productId} (${opts.productName})`);
    } catch (err) {
        logger.error(`Certificate issuance failed: ${err}`);
    }
}

// ── GET /api/certificates/my-certificates ───────────────────────────────────
export const getMyCertificates = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const certificates = await WarrantyCertificate.find({
            userId:  String(req.user!._id),
            isValid: true,
        })
            .sort({ issuedAt: -1 })
            .lean();

        res.json({ success: true, data: certificates });
    }
);

// ── GET /api/certificates/:id/download ──────────────────────────────────────
export const downloadCertificate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const cert = await WarrantyCertificate.findOne({
            _id:    req.params.id,
            userId: String(req.user!._id),
        });

        if (!cert) throw new NotFoundError('Certificate not found.');
        if (!cert.isValid) throw new AuthorizationError('This certificate has been revoked.');

        const pdfBuffer = await generateCertificatePDF(cert);

        const safeName = cert.productName.replace(/[^a-z0-9]/gi, '_');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="WarrantyVault_Certificate_${safeName}_${cert.certificateId}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    }
);

// ── GET /api/certificates/:id/preview ───────────────────────────────────────
// Same as download but inline (for browser preview)
export const previewCertificate = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const cert = await WarrantyCertificate.findOne({
            _id:    req.params.id,
            userId: String(req.user!._id),
        });

        if (!cert) throw new NotFoundError('Certificate not found.');

        const pdfBuffer = await generateCertificatePDF(cert);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
    }
);
