import { Request, Response } from 'express';
import { getMySQLPool } from '../config/database-mysql';
import { asyncHandler } from '../utils/asyncHandler';
import { RowDataPacket } from 'mysql2';

// GET /api/audit-logs — List audit logs with filtering & pagination
export const getAuditLogs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();

    const {
        userId,
        action,
        productId,
        page = '1',
        limit = '50',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit || '50', 10)));
    const offset = (pageNum - 1) * limitNum;

    // ── Build dynamic WHERE clause ──
    const conditions: string[] = [];
    const params: any[] = [];

    if (userId && userId.trim()) {
        conditions.push('user_id = ?');
        params.push(userId.trim());
    }
    if (action && action.trim()) {
        conditions.push('action = ?');
        params.push(action.trim().toUpperCase());
    }
    if (productId && productId.trim()) {
        conditions.push('product_id = ?');
        params.push(parseInt(productId.trim(), 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Count total ──
    const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM user_audit_log ${whereClause}`,
        params
    );
    const totalCount = countRows[0]?.total || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    // ── Fetch data ──
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM user_audit_log ${whereClause} ORDER BY performed_at DESC LIMIT ? OFFSET ?`,
        [...params, limitNum, offset]
    );

    res.json({
        success: true,
        data: rows,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages,
        },
    });
});

// GET /api/audit-logs/stats — Aggregated audit summary
export const getAuditLogStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();

    // Count by action type
    const [actionCounts] = await pool.query<RowDataPacket[]>(`
        SELECT action, COUNT(*) as count
        FROM user_audit_log
        GROUP BY action
        ORDER BY count DESC
    `);

    // Most active users
    const [activeUsers] = await pool.query<RowDataPacket[]>(`
        SELECT user_id, user_name, user_email, COUNT(*) as total_actions,
               SUM(CASE WHEN action = 'INSERT' THEN 1 ELSE 0 END) as inserts,
               SUM(CASE WHEN action = 'UPDATE' THEN 1 ELSE 0 END) as updates,
               SUM(CASE WHEN action = 'DELETE' THEN 1 ELSE 0 END) as deletes
        FROM user_audit_log
        GROUP BY user_id, user_name, user_email
        ORDER BY total_actions DESC
        LIMIT 10
    `);

    // Recent activity (last 10)
    const [recentActivity] = await pool.query<RowDataPacket[]>(`
        SELECT id, user_name, user_email, action, product_name, performed_at
        FROM user_audit_log
        ORDER BY performed_at DESC
        LIMIT 10
    `);

    // Total count
    const [totalRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as total FROM user_audit_log`
    );

    res.json({
        success: true,
        data: {
            totalLogs: totalRows[0]?.total || 0,
            actionCounts,
            activeUsers,
            recentActivity,
        },
    });
});
