import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, AuthenticationError } from '../utils/errors';
import { getSQL } from '../config/database-postgres';
import { logger } from '../utils/logger';

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
                $lt: new Date(now.getFullYear(), now.getMonth(), 1),
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

// PATCH /api/users/me/email — Update logged-in user's email
export const updateEmail = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw new AuthenticationError('Not authenticated.');

    const { email } = req.body as { email?: string };

    if (!email || !email.trim()) {
        throw new AppError('Email is required.', 400, 'VALIDATION_ERROR');
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email.trim())) {
        throw new AppError('Please provide a valid email address.', 400, 'VALIDATION_ERROR');
    }

    const normalised = email.trim().toLowerCase();

    // Check uniqueness (exclude current user)
    const existing = await User.findOne({ email: normalised, _id: { $ne: req.user._id } });
    if (existing) {
        throw new AppError('This email is already in use by another account.', 409, 'CONFLICT');
    }

    const updated = await User.findByIdAndUpdate(
        req.user._id,
        { email: normalised },
        { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, message: 'Email updated successfully.', data: updated });
});

// PATCH /api/users/me/password — Update logged-in user's password
// Flow:
//   Step 1 – bcrypt.comparePassword  (Node / MongoDB layer)
//   Step 2 – fn_validate_password_change PL/pgSQL gate (PostgreSQL)
//             └─ validates inputs, checks current-password result,
//                logs every attempt to password_change_audit, raises
//                typed SQLSTATE errors on any failure.
//   Step 3 – user.save()              (MongoDB write, only on PG success)
export const updatePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) throw new AuthenticationError('Not authenticated.');

    const { currentPassword, newPassword, confirmPassword } = req.body as {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
    };

    // ── Step 0: basic request-level guards ───────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError('All password fields are required.', 400, 'VALIDATION_ERROR');
    }

    if (newPassword !== confirmPassword) {
        throw new AppError('New password and confirm password do not match.', 400, 'VALIDATION_ERROR');
    }

    // ── Step 1: fetch user + bcrypt comparison (MongoDB) ─────────────
    const userId = req.user._id.toString();
    const user   = await User.findById(userId).select('+password');
    if (!user) throw new AuthenticationError('User not found.');

    const isMatch = await user.comparePassword(currentPassword);

    // ── Step 2: PL/pgSQL exception-handling gate (PostgreSQL) ─────────
    // The function validates all rules inside a typed EXCEPTION block,
    // records every attempt in password_change_audit, and raises a
    // custom SQLSTATE error code on any violation.
    try {
        const sql = getSQL();
        await sql`
            SELECT fn_validate_password_change(
                ${userId},
                ${newPassword},
                ${isMatch}
            )
        `;
    } catch (pgErr: any) {
        // Extract the human-readable message from the PostgreSQL error
        const raw: string = pgErr?.message ?? 'Password validation failed.';
        // neon surfaces errors as: 'ERROR:  <msg>\nDETAIL: ...' or just '<msg>'
        const clean = raw.replace(/^ERROR:\s*/i, '').split('\n')[0].trim();
        logger.warn(`[PG_PWD_GATE] ${clean} (user: ${userId})`);
        throw new AppError(clean, 401, 'UNAUTHORIZED');
    }

    // ── Step 3: write new (hashed) password to MongoDB ────────────────
    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    logger.info(`Password changed successfully for user: ${userId}`);
    res.json({ success: true, message: 'Password updated successfully.' });
});
