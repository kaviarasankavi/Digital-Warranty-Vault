import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User, IUser } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticationError } from '../utils/errors';

// GET /api/users — List users with pagination, search, and filtering
export const getUsers = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const {
        search,
        role,
        timeframe,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '12',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '12', 10)));
    const skip = (pageNum - 1) * limitNum;

    // ── Build MongoDB Query ──
    const query: any = {};

    // Search by name or email
    if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [{ name: regex }, { email: regex }];
    }

    // Filter by role
    if (role && role.trim()) {
        if (role !== 'all') {
            query.role = role.trim();
        }
    }

    // Filter by timeframe
    if (timeframe && timeframe !== 'all') {
        const now = new Date();
        if (timeframe === 'this_month') {
            query.createdAt = { $gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        } else if (timeframe === 'last_month') {
            query.createdAt = { 
                $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
                $lt: new Date(now.getFullYear(), now.getMonth(), 1)
            };
        } else if (timeframe === 'this_year') {
            query.createdAt = { $gte: new Date(now.getFullYear(), 0, 1) };
        }
    }

    // ── Sorting ──
    const allowedSortFields = ['name', 'email', 'role', 'createdAt'] as const;
    const sortField = allowedSortFields.includes(sortBy as any) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortConfig: any = { [sortField]: sortDirection };

    // ── Execute Query ──
    const totalCount = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password') // Ensure password is never returned
        .sort(sortConfig)
        .skip(skip)
        .limit(limitNum)
        .lean();

    res.json({
        success: true,
        data: users,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
        },
    });
});
