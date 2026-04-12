import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, AuthorizationError } from '../utils/errors';
import { User } from '../models/User';
import { MongoProduct } from '../models/MongoProduct';
import { VerificationRequest } from '../models/VerificationRequest';
import { WarrantyExtensionRequest } from '../models/WarrantyExtensionRequest';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { WarrantyCertificate } from '../models/WarrantyCertificate';

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
