import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthorizationError, NotFoundError } from '../utils/errors';
import { WarrantyClaim } from '../models/WarrantyClaim';

// ── Brand → Vendor email map ───────────────────────────────────────────────
const BRAND_MAP: Record<string, string> = {
    samsung:  'vendor@samsung.vault',
    dell:     'vendor@dell.vault',
    jbl:      'vendor@jbl.vault',
    firebolt: 'vendor@firebolt.vault',
    sony:     'vendor@sony.vault',
    lg:       'vendor@lg.vault',
    apple:    'vendor@apple.vault',
};

function resolveVendor(brand: string): string | null {
    return BRAND_MAP[brand.toLowerCase().trim()] ?? null;
}

// ── POST /api/claims — User submits a warranty claim ─────────────────────────
export const submitClaim = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        const {
            productId, productName, brand, serialNumber,
            defectDescription, defectType, userPhone,
            location,   // { address, city, state, pincode, landmark }
        } = req.body;

        if (!productId || !productName || !brand)
            throw new ValidationError('productId, productName, and brand are required.');
        if (!defectDescription?.trim())
            throw new ValidationError('defect description is required.');
        if (!location?.address || !location?.city || !location?.state || !location?.pincode)
            throw new ValidationError('location address, city, state, and pincode are required.');

        const vendorEmail = resolveVendor(brand);
        if (!vendorEmail)
            throw new ValidationError(`Brand "${brand}" has no registered vendor.`);

        const existing = await WarrantyClaim.findOne({
            productId,
            userId: String(user._id),
            status: { $in: ['submitted', 'reviewed', 'scheduled'] },
        });
        if (existing) {
            res.status(200).json({
                success: true,
                message: 'An active claim already exists for this product.',
                data: existing,
            });
            return;
        }

        const claim = await WarrantyClaim.create({
            productId,
            productName,
            brand,
            serialNumber:      serialNumber ?? '',
            userId:            String(user._id),
            userName:          user.name,
            userEmail:         user.email,
            userPhone:         userPhone ?? '',
            vendorEmail,
            defectDescription: defectDescription.trim(),
            defectType:        defectType ?? '',
            location: {
                address:  location.address.trim(),
                city:     location.city.trim(),
                state:    location.state.trim(),
                pincode:  location.pincode.trim(),
                landmark: location.landmark?.trim() ?? '',
            },
        });

        res.status(201).json({
            success: true,
            message: `Warranty claim submitted. Claim #${claim.claimNumber} sent to ${brand} service team.`,
            data: claim,
        });
    }
);

// ── GET /api/claims/my-claims — User's own claims ─────────────────────────────
export const getMyClaims = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const claims = await WarrantyClaim.find({ userId: String(req.user!._id) })
            .sort({ submittedAt: -1 })
            .lean();
        res.json({ success: true, data: claims });
    }
);

// ── GET /api/claims/vendor-claims — Vendor inbox ──────────────────────────────
export const getVendorClaims = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { status } = req.query as { status?: string };
        const filter: Record<string, unknown> = { vendorEmail: user.email };
        if (status) filter.status = status;

        const claims = await WarrantyClaim.find(filter)
            .sort({ submittedAt: -1 })
            .lean();
        res.json({ success: true, data: claims });
    }
);

// ── GET /api/claims/vendor-claims/count — Badge count ────────────────────────
export const getVendorClaimCount = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const count = await WarrantyClaim.countDocuments({
            vendorEmail: user.email,
            status: { $in: ['submitted', 'reviewed'] },
        });
        res.json({ success: true, count });
    }
);

// ── PATCH /api/claims/:id/schedule — Vendor schedules a visit ────────────────
export const scheduleClaim = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { scheduledDate, scheduledTime, vendorMessage } = req.body;
        if (!scheduledDate || !scheduledTime)
            throw new ValidationError('scheduledDate and scheduledTime are required.');

        const claim = await WarrantyClaim.findOne({
            _id:         req.params.id,
            vendorEmail: user.email,
        });
        if (!claim) throw new NotFoundError('Claim');

        claim.status        = 'scheduled';
        claim.scheduledDate = scheduledDate;
        claim.scheduledTime = scheduledTime;
        claim.vendorMessage = vendorMessage ?? '';
        claim.scheduledAt   = new Date();
        await claim.save();

        res.json({
            success: true,
            message: `Visit scheduled for ${scheduledDate} at ${scheduledTime}.`,
            data: claim,
        });
    }
);

// ── PATCH /api/claims/:id/complete — Vendor marks as completed ────────────────
export const completeClaim = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const claim = await WarrantyClaim.findOne({
            _id: req.params.id, vendorEmail: user.email,
        });
        if (!claim) throw new NotFoundError('Claim');

        claim.status      = 'completed';
        claim.completedAt = new Date();
        claim.vendorMessage = req.body.vendorMessage ?? claim.vendorMessage;
        await claim.save();

        res.json({ success: true, message: 'Claim marked as completed.', data: claim });
    }
);

// ── PATCH /api/claims/:id/reject — Vendor rejects ────────────────────────────
export const rejectClaim = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const claim = await WarrantyClaim.findOne({
            _id: req.params.id, vendorEmail: user.email,
        });
        if (!claim) throw new NotFoundError('Claim');

        claim.status          = 'rejected';
        claim.rejectionReason = req.body.reason ?? '';
        claim.vendorMessage   = req.body.vendorMessage ?? '';
        await claim.save();

        res.json({ success: true, message: 'Claim rejected.', data: claim });
    }
);
