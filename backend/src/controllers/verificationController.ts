import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors';
import { VerificationRequest } from '../models/VerificationRequest';

// ── Brand → Vendor email map ──────────────────────────────────────────────────
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

// ── POST /api/verify/request ──────────────────────────────────────────────────
// User submits a verification request for one of their products
export const createVerificationRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        const { productId, productName, brand, serialNumber } = req.body;

        if (!productId || !productName || !brand) {
            throw new ValidationError('productId, productName, and brand are required.');
        }

        const vendorEmail = resolveVendorEmail(brand);
        if (!vendorEmail) {
            throw new ValidationError(
                `Brand "${brand}" is not registered with any vendor. Supported: ${Object.keys(BRAND_MAP).join(', ')}.`
            );
        }

        // Prevent duplicate pending requests for the same product
        const existing = await VerificationRequest.findOne({
            productId,
            userId: String(user._id),
            status: 'pending',
        });
        if (existing) {
            res.status(200).json({
                success: true,
                message: 'Verification request already pending.',
                data: existing,
            });
            return;
        }

        const request = await VerificationRequest.create({
            productId,
            productName,
            brand,
            serialNumber: serialNumber ?? '',
            userId:    String(user._id),
            userName:  user.name,
            userEmail: user.email,
            vendorEmail,
            status: 'pending',
        });

        res.status(201).json({
            success: true,
            message: `Verification request sent to ${brand} vendor.`,
            data: request,
        });
    }
);

// ── GET /api/verify/my-requests ───────────────────────────────────────────────
// Current user's own verification requests
export const getMyRequests = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;

        const requests = await VerificationRequest.find({ userId: String(user._id) })
            .sort({ requestedAt: -1 })
            .lean();

        res.json({ success: true, data: requests });
    }
);

// ── GET /api/verify/vendor-requests ──────────────────────────────────────────
// Vendor sees all requests routed to their brand email
export const getVendorRequests = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;

        if (user.role !== 'vendor') {
            throw new AuthorizationError('Only vendor accounts can access this endpoint.');
        }

        const { status } = req.query as { status?: string };
        const filter: Record<string, unknown> = { vendorEmail: user.email };
        if (status) filter.status = status;

        const requests = await VerificationRequest.find(filter)
            .sort({ requestedAt: -1 })
            .lean();

        res.json({ success: true, data: requests });
    }
);

// ── GET /api/verify/vendor-requests/count ────────────────────────────────────
// Pending request count for badge in sidebar
export const getVendorPendingCount = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;

        if (user.role !== 'vendor') {
            throw new AuthorizationError('Only vendor accounts can access this endpoint.');
        }

        const count = await VerificationRequest.countDocuments({
            vendorEmail: user.email,
            status: 'pending',
        });

        res.json({ success: true, count });
    }
);

// ── PATCH /api/verify/requests/:id/verify ────────────────────────────────────
export const verifyRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;

        if (user.role !== 'vendor') {
            throw new AuthorizationError('Only vendor accounts can verify requests.');
        }

        const request = await VerificationRequest.findOne({
            _id:         req.params.id,
            vendorEmail: user.email,
        });

        if (!request) throw new NotFoundError('Verification request not found.');

        request.status     = 'verified';
        request.verifiedAt = new Date();
        request.vendorNote = req.body.note ?? '';
        await request.save();

        res.json({ success: true, message: 'Product verified successfully.', data: request });
    }
);

// ── PATCH /api/verify/requests/:id/reject ────────────────────────────────────
export const rejectRequest = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;

        if (user.role !== 'vendor') {
            throw new AuthorizationError('Only vendor accounts can reject requests.');
        }

        const request = await VerificationRequest.findOne({
            _id:         req.params.id,
            vendorEmail: user.email,
        });

        if (!request) throw new NotFoundError('Verification request not found.');

        request.status     = 'rejected';
        request.verifiedAt = new Date();
        request.vendorNote = req.body.note ?? '';
        await request.save();

        res.json({ success: true, message: 'Request rejected.', data: request });
    }
);
