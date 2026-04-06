import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSQL } from '../config/database-postgres';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import { AuthenticationError, NotFoundError } from '../utils/errors';

// GET /api/triggers/audit-log — Fetch product audit logs for the authenticated user
export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();

    // Optional query params for filtering
    const { action, productId, limit = '50' } = req.query;

    let logs: any[];
    if (productId && action) {
        logs = await sql`
            SELECT * FROM product_audit_log
            WHERE user_id = ${userId}
              AND product_id = ${Number(productId)}
              AND action = ${String(action).toUpperCase()}
            ORDER BY changed_at DESC
            LIMIT ${Number(limit)}
        ` as any[];
    } else if (productId) {
        logs = await sql`
            SELECT * FROM product_audit_log
            WHERE user_id = ${userId}
              AND product_id = ${Number(productId)}
            ORDER BY changed_at DESC
            LIMIT ${Number(limit)}
        ` as any[];
    } else if (action) {
        logs = await sql`
            SELECT * FROM product_audit_log
            WHERE user_id = ${userId}
              AND action = ${String(action).toUpperCase()}
            ORDER BY changed_at DESC
            LIMIT ${Number(limit)}
        ` as any[];
    } else {
        logs = await sql`
            SELECT * FROM product_audit_log
            WHERE user_id = ${userId}
            ORDER BY changed_at DESC
            LIMIT ${Number(limit)}
        ` as any[];
    }

    res.json({
        success: true,
        data: logs,
        count: logs.length,
    });
});

// GET /api/triggers/warranty-status — Fetch warranty statuses for user's products
export const getWarrantyStatuses = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();
    const statuses = await sql`
        SELECT ws.*, p.name as product_name, p.brand, p."warrantyExpiry"
        FROM warranty_status ws
        JOIN products p ON ws.product_id = p.id
        WHERE p."userId" = ${userId}
        ORDER BY ws.days_remaining ASC
    ` as any[];

    res.json({
        success: true,
        data: statuses,
        count: statuses.length,
    });
});

// GET /api/triggers/price-history/:productId — Fetch price change history
export const getPriceHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    const { productId } = req.params;

    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();

    // Verify ownership
    const product = await sql`
        SELECT id FROM products WHERE id = ${Number(productId)} AND "userId" = ${userId}
    ` as any[];

    if (product.length === 0) {
        throw new NotFoundError('Product');
    }

    const history = await sql`
        SELECT * FROM price_change_history
        WHERE product_id = ${Number(productId)}
        ORDER BY changed_at DESC
    ` as any[];

    res.json({
        success: true,
        data: history,
        count: history.length,
    });
});

// GET /api/triggers/summary — Get a summary of all trigger activity
export const getTriggerSummary = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();

    // Count of audit log entries by action type
    const auditCounts = await sql`
        SELECT action, COUNT(*) as count
        FROM product_audit_log
        WHERE user_id = ${userId}
        GROUP BY action
        ORDER BY action
    ` as any[];

    // Warranty status breakdown
    const warrantyCounts = await sql`
        SELECT ws.status, COUNT(*) as count
        FROM warranty_status ws
        JOIN products p ON ws.product_id = p.id
        WHERE p."userId" = ${userId}
        GROUP BY ws.status
        ORDER BY ws.status
    ` as any[];

    // Total price changes
    const priceChangeCount = await sql`
        SELECT COUNT(*) as count
        FROM price_change_history pch
        JOIN products p ON pch.product_id = p.id
        WHERE p."userId" = ${userId}
    ` as any[];

    res.json({
        success: true,
        data: {
            auditLogByAction: auditCounts,
            warrantyStatusBreakdown: warrantyCounts,
            totalPriceChanges: priceChangeCount[0]?.count || 0,
        },
    });
});
