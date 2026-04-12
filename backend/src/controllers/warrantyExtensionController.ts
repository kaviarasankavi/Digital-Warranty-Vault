import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors';
import { WarrantyExtensionRequest } from '../models/WarrantyExtensionRequest';
import { MongoProduct } from '../models/MongoProduct';
import { MongoWarranty } from '../models/MongoWarranty';
import { getSQL } from '../config/database-postgres';
import { logger } from '../utils/logger';

// ── Brand → Vendor email map (same as verificationController) ──────────────
const BRAND_MAP: Record<string, string> = {
    samsung:  'vendor@samsung.vault',
    dell:     'vendor@dell.vault',
    jbl:      'vendor@jbl.vault',
    firebolt: 'vendor@firebolt.vault',
    sony:     'vendor@sony.vault',
    lg:       'vendor@lg.vault',
    apple:    'vendor@apple.vault',
};

function resolveVendorEmail(brand: string): string | null {
    return BRAND_MAP[brand.toLowerCase().trim()] ?? null;
}

// ── POST /api/warranty-extension/request ────────────────────────────────────
export const createExtensionRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        const { productId, productName, brand, serialNumber, currentExpiry, requestedExpiry, reason } = req.body;

        if (!productId || !productName || !brand) {
            throw new ValidationError('productId, productName, and brand are required.');
        }

        const vendorEmail = resolveVendorEmail(brand);
        if (!vendorEmail) {
            throw new ValidationError(
                `Brand "${brand}" is not registered with any vendor.`
            );
        }

        // Prevent duplicate pending requests for the same product
        const existing = await WarrantyExtensionRequest.findOne({
            productId,
            userId: String(user._id),
            status: 'pending',
        });
        if (existing) {
            res.status(200).json({
                success: true,
                message: 'Extension request already pending.',
                data: existing,
            });
            return;
        }

        const request = await WarrantyExtensionRequest.create({
            productId,
            productName,
            brand,
            serialNumber: serialNumber ?? '',
            userId:          String(user._id),
            userName:        user.name,
            userEmail:       user.email,
            vendorEmail,
            currentExpiry:   currentExpiry   ? new Date(currentExpiry)   : null,
            requestedExpiry: requestedExpiry ? new Date(requestedExpiry) : null,
            reason:          reason ?? '',
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            message: `Warranty extension request sent to ${brand} vendor.`,
            data: request,
        });
    }
);

// ── GET /api/warranty-extension/my-requests ──────────────────────────────────
export const getMyExtensionRequests = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        const requests = await WarrantyExtensionRequest.find({ userId: String(user._id) })
            .sort({ requestedAt: -1 })
            .lean();
        res.json({ success: true, data: requests });
    }
);

// ── GET /api/warranty-extension/vendor-requests ──────────────────────────────
export const getVendorExtensionRequests = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { status } = req.query as { status?: string };
        const filter: Record<string, unknown> = { vendorEmail: user.email };
        if (status) filter.status = status;

        const requests = await WarrantyExtensionRequest.find(filter)
            .sort({ requestedAt: -1 })
            .lean();

        res.json({ success: true, data: requests });
    }
);

// ── GET /api/warranty-extension/vendor-requests/count ────────────────────────
export const getVendorExtensionPendingCount = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const count = await WarrantyExtensionRequest.countDocuments({
            vendorEmail: user.email,
            status: 'pending',
        });

        res.json({ success: true, count });
    }
);

// ── PATCH /api/warranty-extension/requests/:id/approve ──────────────────────
// Vendor approves — sets new expiry and updates PostgreSQL + MongoDB
export const approveExtensionRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { newExpiry, note } = req.body;
        if (!newExpiry) throw new ValidationError('newExpiry date is required to approve.');

        const request = await WarrantyExtensionRequest.findOne({
            _id:         req.params.id,
            vendorEmail: user.email,
            status:      'pending',
        });

        if (!request) throw new NotFoundError('Extension request');

        const newExpiryDate = new Date(newExpiry);

        // 1. Update MongoDB request document
        request.status     = 'approved';
        request.newExpiry  = newExpiryDate;
        request.vendorNote = note ?? '';
        request.resolvedAt = new Date();
        await request.save();

        // 2. Update PostgreSQL product's warrantyExpiry
        const sql = getSQL();
        try {
            await sql`
                UPDATE products
                SET "warrantyExpiry" = ${newExpiryDate.toISOString()}, "updatedAt" = NOW()
                WHERE id = ${request.productId} AND "userId" = ${request.userId}
            `;
            logger.info(`Warranty extended for productId=${request.productId} → ${newExpiryDate.toISOString()}`);
        } catch (pgErr) {
            logger.error(`PG warranty update failed: ${pgErr}`);
        }

        // 3. Sync to MongoDB product store
        try {
            const mongoProd = await MongoProduct.findOneAndUpdate(
                { pgId: request.productId, userId: request.userId },
                { warrantyExpiry: newExpiryDate }
            );
            if (mongoProd) {
                const daysLeft = (newExpiryDate.getTime() - Date.now()) / 86400000;
                const wStatus = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'expiring' : 'active';
                await MongoWarranty.findOneAndUpdate(
                    { productId: mongoProd._id },
                    { status: wStatus, endDate: newExpiryDate }
                );
            }
        } catch (mongoErr) {
            logger.error(`MongoDB warranty sync failed: ${mongoErr}`);
        }

        res.json({
            success: true,
            message: `Warranty extended until ${newExpiryDate.toLocaleDateString()}.`,
            data: request,
        });
    }
);

// ── PATCH /api/warranty-extension/requests/:id/deny ─────────────────────────
export const denyExtensionRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const request = await WarrantyExtensionRequest.findOne({
            _id:         req.params.id,
            vendorEmail: user.email,
        });

        if (!request) throw new NotFoundError('Extension request');

        request.status     = 'denied';
        request.vendorNote = req.body.note ?? '';
        request.resolvedAt = new Date();
        await request.save();

        res.json({ success: true, message: 'Request denied.', data: request });
    }
);
