import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { MongoProduct } from '../models/MongoProduct';
import { MongoWarranty } from '../models/MongoWarranty';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { seedMongoData } from '../scripts/seedMongo';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: ensure sample data exists for the user (lazy seed on first request)
// ─────────────────────────────────────────────────────────────────────────────
async function ensureSeeded(userId: string): Promise<void> {
    const count = await MongoProduct.countDocuments({ userId });
    if (count === 0) {
        await seedMongoData(userId);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/analytics/category-summary
//    Pipeline stages: $match → $group → $project
//    Groups products by category with count, total spend, and average price
// ─────────────────────────────────────────────────────────────────────────────
export const getCategorySummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    await ensureSeeded(userId);

    const pipeline = [
        // Stage 1: $match — filter to only this user's products
        {
            $match: {
                userId: userId,
            },
        },
        // Stage 2: $group — aggregate by category
        {
            $group: {
                _id: '$category',
                productCount: { $sum: 1 },
                totalSpend: { $sum: '$purchasePrice' },
                avgPrice: { $avg: '$purchasePrice' },
                minPrice: { $min: '$purchasePrice' },
                maxPrice: { $max: '$purchasePrice' },
            },
        },
        // Stage 3: $project — reshape and format output
        {
            $project: {
                _id: 0,
                category: '$_id',
                productCount: 1,
                totalSpend: { $round: ['$totalSpend', 2] },
                avgPrice: { $round: ['$avgPrice', 2] },
                minPrice: { $round: ['$minPrice', 2] },
                maxPrice: { $round: ['$maxPrice', 2] },
                formattedTotal: {
                    $concat: [{ $literal: '$' }, { $toString: { $round: ['$totalSpend', 2] } }],
                },
            },
        },
        // Sort by product count descending
        { $sort: { productCount: -1 as const } },
    ];

    logger.info(`[Analytics] Running category-summary pipeline for user ${userId}`);
    const results = await MongoProduct.aggregate(pipeline);

    // Compute percentages
    const totalProducts = results.reduce((sum: number, r: any) => sum + r.productCount, 0);
    const enrichedResults = results.map((r: any) => ({
        ...r,
        percentage: totalProducts > 0 ? Math.round((r.productCount / totalProducts) * 100) : 0,
    }));

    res.json({
        success: true,
        pipeline: '$match → $group → $project',
        data: enrichedResults,
        summary: {
            totalCategories: results.length,
            totalProducts,
            totalSpend: results.reduce((sum: number, r: any) => sum + r.totalSpend, 0),
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/analytics/warranty-status
//    Pipeline stages: $match → $group → $project
//    Groups warranties by status (active/expired/expiring) with count
// ─────────────────────────────────────────────────────────────────────────────
export const getWarrantyStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    await ensureSeeded(userId);

    const pipeline = [
        // Stage 1: $match — filter by user, optionally by warranty type
        {
            $match: {
                userId: userId,
                ...(req.query.warrantyType ? { warrantyType: req.query.warrantyType } : {}),
            },
        },
        // Stage 2: $group — aggregate by warranty status
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalClaims: { $sum: '$claimCount' },
                warranties: {
                    $push: {
                        warrantyType: '$warrantyType',
                        endDate: '$endDate',
                    },
                },
            },
        },
        // Stage 3: $project — reshape with friendly labels
        {
            $project: {
                _id: 0,
                status: '$_id',
                count: 1,
                totalClaims: 1,
                label: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id', 'active'] }, then: 'Active Warranties' },
                            { case: { $eq: ['$_id', 'expired'] }, then: 'Expired Warranties' },
                            { case: { $eq: ['$_id', 'expiring'] }, then: 'Expiring Soon' },
                        ],
                        default: 'Unknown',
                    },
                },
                color: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id', 'active'] }, then: '#10b981' },
                            { case: { $eq: ['$_id', 'expired'] }, then: '#f43f5e' },
                            { case: { $eq: ['$_id', 'expiring'] }, then: '#f59e0b' },
                        ],
                        default: '#6366f1',
                    },
                },
                warrantyCount: { $size: '$warranties' },
            },
        },
    ];

    logger.info(`[Analytics] Running warranty-status pipeline for user ${userId}`);
    const results = await MongoWarranty.aggregate(pipeline);

    const totalWarranties = results.reduce((sum: number, r: any) => sum + r.count, 0);
    const enrichedResults = results.map((r: any) => ({
        ...r,
        percentage: totalWarranties > 0 ? Math.round((r.count / totalWarranties) * 100) : 0,
    }));

    res.json({
        success: true,
        pipeline: '$match → $group → $project',
        data: enrichedResults,
        summary: {
            totalWarranties,
            totalClaims: results.reduce((sum: number, r: any) => sum + r.totalClaims, 0),
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/analytics/monthly-spending
//    Pipeline stages: $match → $group → $project
//    Groups products by purchase month to show spending trends
// ─────────────────────────────────────────────────────────────────────────────
export const getMonthlySpending = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    await ensureSeeded(userId);

    // Default to last 12 months
    const monthsBack = parseInt(req.query.months as string) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);

    const pipeline = [
        // Stage 1: $match — filter by user and date range
        {
            $match: {
                userId: userId,
                purchaseDate: { $gte: startDate },
            },
        },
        // Stage 2: $group — aggregate by year and month
        {
            $group: {
                _id: {
                    year: { $year: '$purchaseDate' },
                    month: { $month: '$purchaseDate' },
                },
                totalSpend: { $sum: '$purchasePrice' },
                productCount: { $sum: 1 },
                avgPrice: { $avg: '$purchasePrice' },
                categories: { $addToSet: '$category' },
            },
        },
        // Stage 3: $project — format date label and reshape
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                label: {
                    $let: {
                        vars: {
                            monthNames: [
                                '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                            ],
                        },
                        in: {
                            $concat: [
                                { $arrayElemAt: ['$$monthNames', '$_id.month'] },
                                ' ',
                                { $toString: '$_id.year' },
                            ],
                        },
                    },
                },
                totalSpend: { $round: ['$totalSpend', 2] },
                productCount: 1,
                avgPrice: { $round: ['$avgPrice', 2] },
                categoryCount: { $size: '$categories' },
            },
        },
        // Sort chronologically
        { $sort: { year: 1 as const, month: 1 as const } },
    ];

    logger.info(`[Analytics] Running monthly-spending pipeline for user ${userId}`);
    const results = await MongoProduct.aggregate(pipeline);

    res.json({
        success: true,
        pipeline: '$match → $group → $project',
        data: results,
        summary: {
            totalMonths: results.length,
            grandTotal: results.reduce((sum: number, r: any) => sum + r.totalSpend, 0),
            totalProducts: results.reduce((sum: number, r: any) => sum + r.productCount, 0),
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/analytics/brand-analytics
//    Pipeline stages: $match → $group → $project
//    Groups products by brand for insights on brand distribution
// ─────────────────────────────────────────────────────────────────────────────
export const getBrandAnalytics = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    await ensureSeeded(userId);

    const pipeline = [
        // Stage 1: $match — filter by user, exclude empty brands
        {
            $match: {
                userId: userId,
                brand: { $ne: '' },
            },
        },
        // Stage 2: $group — aggregate by brand
        {
            $group: {
                _id: '$brand',
                productCount: { $sum: 1 },
                totalValue: { $sum: '$purchasePrice' },
                avgPrice: { $avg: '$purchasePrice' },
                categories: { $addToSet: '$category' },
                latestPurchase: { $max: '$purchaseDate' },
                oldestPurchase: { $min: '$purchaseDate' },
            },
        },
        // Stage 3: $project — reshape with enriched fields
        {
            $project: {
                _id: 0,
                brand: '$_id',
                productCount: 1,
                totalValue: { $round: ['$totalValue', 2] },
                avgPrice: { $round: ['$avgPrice', 2] },
                categoryCount: { $size: '$categories' },
                categories: 1,
                latestPurchase: 1,
                formattedValue: {
                    $concat: [{ $literal: '$' }, { $toString: { $round: ['$totalValue', 2] } }],
                },
            },
        },
        // Sort by total value descending
        { $sort: { totalValue: -1 as const } },
    ];

    logger.info(`[Analytics] Running brand-analytics pipeline for user ${userId}`);
    const results = await MongoProduct.aggregate(pipeline);

    const grandTotal = results.reduce((sum: number, r: any) => sum + r.totalValue, 0);
    const enrichedResults = results.map((r: any, index: number) => ({
        ...r,
        rank: index + 1,
        percentage: grandTotal > 0 ? Math.round((r.totalValue / grandTotal) * 100) : 0,
    }));

    res.json({
        success: true,
        pipeline: '$match → $group → $project',
        data: enrichedResults,
        summary: {
            totalBrands: results.length,
            grandTotal: Math.round(grandTotal * 100) / 100,
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /api/analytics/price-distribution
//    Pipeline stages: $match → $group → $project
//    Creates a histogram of products by price buckets
// ─────────────────────────────────────────────────────────────────────────────
export const getPriceDistribution = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) throw new AuthenticationError('Unauthorized');

    await ensureSeeded(userId);

    const pipeline = [
        // Stage 1: $match — filter by user, only products with price > 0
        {
            $match: {
                userId: userId,
                purchasePrice: { $gt: 0 },
            },
        },
        // Stage 2: $group — group by price bucket
        {
            $group: {
                _id: {
                    $switch: {
                        branches: [
                            { case: { $lte: ['$purchasePrice', 100] }, then: '0-100' },
                            { case: { $lte: ['$purchasePrice', 300] }, then: '100-300' },
                            { case: { $lte: ['$purchasePrice', 500] }, then: '300-500' },
                            { case: { $lte: ['$purchasePrice', 1000] }, then: '500-1000' },
                            { case: { $lte: ['$purchasePrice', 2000] }, then: '1000-2000' },
                            { case: { $lte: ['$purchasePrice', 3000] }, then: '2000-3000' },
                        ],
                        default: '3000+',
                    },
                },
                count: { $sum: 1 },
                totalValue: { $sum: '$purchasePrice' },
                avgPrice: { $avg: '$purchasePrice' },
                products: { $push: '$name' },
            },
        },
        // Stage 3: $project — format with range labels and order key
        {
            $project: {
                _id: 0,
                range: '$_id',
                count: 1,
                totalValue: { $round: ['$totalValue', 2] },
                avgPrice: { $round: ['$avgPrice', 2] },
                label: {
                    $concat: [{ $literal: '$' }, '$_id'],
                },
                sortOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$_id', '0-100'] }, then: 1 },
                            { case: { $eq: ['$_id', '100-300'] }, then: 2 },
                            { case: { $eq: ['$_id', '300-500'] }, then: 3 },
                            { case: { $eq: ['$_id', '500-1000'] }, then: 4 },
                            { case: { $eq: ['$_id', '1000-2000'] }, then: 5 },
                            { case: { $eq: ['$_id', '2000-3000'] }, then: 6 },
                        ],
                        default: 7,
                    },
                },
                sampleProducts: { $slice: ['$products', 3] },
            },
        },
        { $sort: { sortOrder: 1 as const } },
    ];

    logger.info(`[Analytics] Running price-distribution pipeline for user ${userId}`);
    const results = await MongoProduct.aggregate(pipeline);

    const totalProducts = results.reduce((sum: number, r: any) => sum + r.count, 0);
    const enrichedResults = results.map((r: any) => ({
        ...r,
        percentage: totalProducts > 0 ? Math.round((r.count / totalProducts) * 100) : 0,
    }));

    res.json({
        success: true,
        pipeline: '$match → $group → $project',
        data: enrichedResults,
        summary: {
            totalProducts,
            totalBuckets: results.length,
            grandTotal: results.reduce((sum: number, r: any) => sum + r.totalValue, 0),
        },
    });
});
