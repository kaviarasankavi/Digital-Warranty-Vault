import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, AuthorizationError, ValidationError } from '../utils/errors';
import { User } from '../models/User';
import { MongoProduct } from '../models/MongoProduct';
import { VerificationRequest } from '../models/VerificationRequest';
import { WarrantyExtensionRequest } from '../models/WarrantyExtensionRequest';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { WarrantyCertificate } from '../models/WarrantyCertificate';
import { Dispute } from '../models/Dispute';

// ── PATCH /api/admin/users/:id/suspend ──────────────────────────────────────
export const suspendUser = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = await User.findById(req.params.id);
        if (!user) throw new NotFoundError('User not found.');
        if (user.role === 'admin') throw new AuthorizationError('Cannot suspend an admin account.');

        (user as any).suspended = true;
        await user.save();
        res.json({ success: true, message: `${user.name} has been suspended.` });
    }
);

// ── PATCH /api/admin/users/:id/unsuspend ────────────────────────────────────
export const unsuspendUser = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = await User.findById(req.params.id);
        if (!user) throw new NotFoundError('User not found.');

        (user as any).suspended = false;
        await user.save();
        res.json({ success: true, message: `${user.name} has been reinstated.` });
    }
);

// ── GET /api/admin/users/:id/details ────────────────────────────────────────
// Full user details: products, verifications, extensions, claims, certificates
export const getUserDetails = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) throw new NotFoundError('User not found.');

        const userId = String(user._id);

        const [products, verifications, extensions, claims, certificates] = await Promise.all([
            MongoProduct.countDocuments({ userId }),
            VerificationRequest.countDocuments({ userId }),
            WarrantyExtensionRequest.countDocuments({ userId }),
            WarrantyClaim.countDocuments({ userId }),
            WarrantyCertificate.countDocuments({ userId }),
        ]);

        res.json({
            success: true,
            data: {
                ...user.toObject(),
                stats: { products, verifications, extensions, claims, certificates },
            },
        });
    }
);

// ── GET /api/admin/analytics ─────────────────────────────────────────────────
// Platform-wide aggregated stats for the admin analytics page
export const getPlatformAnalytics = asyncHandler(
    async (_req: Request, res: Response): Promise<void> => {
        // Run all aggregations in parallel
        const [
            totalUsers,
            totalVendors,
            totalProducts,
            totalVerifications,
            verifiedCount,
            rejectedCount,
            totalExtensions,
            approvedExtensions,
            totalClaims,
            scheduledClaims,
            completedClaims,
            totalCertificates,
            // Monthly user signups (last 6 months)
            monthlySignups,
            // Brand distribution
            brandDist,
            // Verification status breakdown
            verifyBreakdown,
            // Claims status breakdown
            claimBreakdown,
        ] = await Promise.all([
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'vendor' }),
            MongoProduct.countDocuments({}),
            VerificationRequest.countDocuments({}),
            VerificationRequest.countDocuments({ status: 'verified' }),
            VerificationRequest.countDocuments({ status: 'rejected' }),
            WarrantyExtensionRequest.countDocuments({}),
            WarrantyExtensionRequest.countDocuments({ status: 'approved' }),
            WarrantyClaim.countDocuments({}),
            WarrantyClaim.countDocuments({ status: 'scheduled' }),
            WarrantyClaim.countDocuments({ status: 'completed' }),
            WarrantyCertificate.countDocuments({ isValid: true }),

            // Monthly signups (aggregation pipeline)
            User.aggregate([
                {
                    $match: {
                        role: 'user',
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1)),
                        },
                    },
                },
                {
                    $group: {
                        _id: {
                            year:  { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),

            // Brand distribution
            MongoProduct.aggregate([
                { $group: { _id: '$brand', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
            ]),

            // Verification status pie
            VerificationRequest.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),

            // Claims status pie
            WarrantyClaim.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]),
        ]);

        // Format monthly signups for chart
        const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const signupChart = monthlySignups.map((m: any) => ({
            month: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
            users: m.count,
        }));

        const brandChart = brandDist.map((b: any) => ({
            brand: b._id || 'Unknown',
            products: b.count,
        }));

        const verifyChart = verifyBreakdown.map((v: any) => ({
            status: v._id,
            count:  v.count,
        }));

        const claimChart = claimBreakdown.map((c: any) => ({
            status: c._id,
            count:  c.count,
        }));

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalVendors,
                    totalProducts,
                    totalVerifications,
                    verifiedCount,
                    rejectedCount,
                    totalExtensions,
                    approvedExtensions,
                    totalClaims,
                    scheduledClaims,
                    completedClaims,
                    totalCertificates,
                },
                charts: {
                    monthlySignups: signupChart,
                    brandDistribution: brandChart,
                    verificationBreakdown: verifyChart,
                    claimBreakdown: claimChart,
                },
            },
        });
    }
);

// ── GET /api/admin/verifications ─────────────────────────────────────────────
// Full verification audit log — all requests across all users and vendors
export const getVerificationLog = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const {
            status,
            search,
            page  = '1',
            limit = '25',
        } = req.query as Record<string, string | undefined>;

        const pageNum  = Math.max(1, parseInt(page  || '1',  10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit || '25', 10)));
        const skip     = (pageNum - 1) * limitNum;

        // Build query
        const query: any = {};
        if (status && status !== 'all') query.status = status;
        if (search && search.trim()) {
            const re = new RegExp(search.trim(), 'i');
            query.$or = [
                { userName:    re },
                { userEmail:   re },
                { productName: re },
                { brand:       re },
                { vendorEmail: re },
            ];
        }

        const [total, docs] = await Promise.all([
            VerificationRequest.countDocuments(query),
            VerificationRequest.find(query)
                .sort({ requestedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);

        // Summary counts (always global, not filtered)
        const [pending, verified, rejected] = await Promise.all([
            VerificationRequest.countDocuments({ status: 'pending'  }),
            VerificationRequest.countDocuments({ status: 'verified' }),
            VerificationRequest.countDocuments({ status: 'rejected' }),
        ]);

        res.json({
            success: true,
            data: docs,
            summary: { total: pending + verified + rejected, pending, verified, rejected },
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalCount: total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
);

// ── GET /api/admin/disputes ──────────────────────────────────────────────────
export const getAdminDisputes = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { status, page = '1', limit = '25' } = req.query as Record<string, string | undefined>;
        const pageNum  = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;

        const query: any = {};
        if (status && status !== 'all') query.status = status;

        const [total, docs] = await Promise.all([
            Dispute.countDocuments(query),
            Dispute.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean()
        ]);

        const [open, resolved_user, resolved_vendor] = await Promise.all([
            Dispute.countDocuments({ status: 'open' }),
            Dispute.countDocuments({ status: 'resolved_user' }),
            Dispute.countDocuments({ status: 'resolved_vendor' }),
        ]);

        res.json({
            success: true,
            data: docs,
            summary: { total: open + resolved_user + resolved_vendor, open, resolved_user, resolved_vendor },
            pagination: { page: pageNum, limit: limitNum, totalCount: total, totalPages: Math.ceil(total / limitNum) }
        });
    }
);

// ── POST /api/admin/disputes/:id/message ─────────────────────────────────────
export const addAdminMessage = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { text } = req.body;
        if (!text) throw new ValidationError('Message text required.');

        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) throw new NotFoundError('Dispute not found.');
        if (dispute.status !== 'open') throw new ValidationError('Cannot message a resolved dispute.');

        dispute.messages.push({
            sender: 'admin',
            senderName: 'System Administrator',
            text,
            timestamp: new Date()
        });

        await dispute.save();
        res.json({ success: true, data: dispute });
    }
);

// ── PATCH /api/admin/disputes/:id/resolve ────────────────────────────────────
export const resolveDispute = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { resolution, resolutionReason } = req.body;
        if (!['force_approve', 'uphold_rejection'].includes(resolution)) {
            throw new ValidationError('Invalid resolution type.');
        }

        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) throw new NotFoundError('Dispute not found.');
        if (dispute.status !== 'open') throw new ValidationError('Dispute is already resolved.');

        const newStatus = resolution === 'force_approve' ? 'resolved_user' : 'resolved_vendor';
        dispute.status = newStatus;
        dispute.resolutionReason = resolutionReason || '';

        // Update underlying model
        if (dispute.referenceType === 'claim') {
            const claim = await WarrantyClaim.findById(dispute.referenceId);
            if (claim) {
                claim.isEscalated = false;
                if (resolution === 'force_approve') {
                    claim.status = 'completed';
                    claim.vendorMessage += '\n[SYSTEM] Claim force-approved by Admin via Dispute Resolution.';
                }
                await claim.save();
            }
        } else if (dispute.referenceType === 'verification') {
            const verify = await VerificationRequest.findById(dispute.referenceId);
            if (verify) {
                verify.isEscalated = false;
                if (resolution === 'force_approve') {
                    verify.status = 'verified';
                    verify.verifiedAt = new Date();
                    verify.vendorNote += '\n[SYSTEM] Verification force-approved by Admin via Dispute Resolution.';
                }
                await verify.save();
            }
        }

        await dispute.save();
        res.json({ success: true, data: dispute });
    }
);

