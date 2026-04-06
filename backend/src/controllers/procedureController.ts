import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSQL } from '../config/database-postgres';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import {
    AuthenticationError,
    ValidationError,
    DatabaseError,
} from '../utils/errors';

/**
 * Extracts a user-friendly message from PostgreSQL RAISE EXCEPTION errors.
 */
const parsePgError = (error: any): string => {
    if (error?.message?.includes('RAISE')) {
        return error.message.split('RAISE: ')[1] || error.message;
    }
    return error?.message || 'Database operation failed';
};

// POST /api/procedures/register-product — Register product via stored procedure
export const registerProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const {
        name,
        brand,
        model,
        serialNumber,
        category,
        purchaseDate,
        purchasePrice,
        warrantyExpiry,
        notes,
    } = req.body;

    if (!name || !name.trim()) {
        throw new ValidationError('Product name is required.');
    }

    const sql = getSQL();

    try {
        // Call the stored procedure
        await sql`
            CALL sp_register_product(
                ${userId},
                ${name.trim()},
                ${brand || ''},
                ${model || ''},
                ${serialNumber || ''},
                ${category || ''},
                ${purchaseDate || ''},
                ${purchasePrice || 0},
                ${warrantyExpiry || ''},
                ${notes || ''}
            )
        `;
    } catch (pgError: any) {
        throw new DatabaseError(parsePgError(pgError), pgError);
    }

    // Fetch the newly created product (last one by this user)
    const result = await sql`
        SELECT * FROM products
        WHERE "userId" = ${userId}
        ORDER BY "createdAt" DESC
        LIMIT 1
    ` as any[];

    logger.info(`Product registered via procedure: ${name} (user: ${userId})`);

    res.status(201).json({
        success: true,
        message: 'Product registered successfully via stored procedure.',
        data: result[0],
    });
});

// POST /api/procedures/transfer-ownership — Transfer product ownership
export const transferOwnership = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const { productId, toUserId } = req.body;

    if (!productId || !toUserId) {
        throw new ValidationError('productId and toUserId are required.');
    }

    const sql = getSQL();

    try {
        await sql`
            CALL sp_transfer_ownership(
                ${Number(productId)},
                ${userId},
                ${toUserId}
            )
        `;
    } catch (pgError: any) {
        throw new DatabaseError(parsePgError(pgError), pgError);
    }

    logger.info(`Ownership transferred: product ${productId} from ${userId} to ${toUserId}`);

    res.json({
        success: true,
        message: 'Ownership transferred successfully.',
    });
});

// POST /api/procedures/bulk-update-warranty — Recalculate warranty status for all user products
export const bulkUpdateWarrantyStatus = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();

    try {
        await sql`
            CALL sp_bulk_update_warranty_status(${userId})
        `;
    } catch (pgError: any) {
        throw new DatabaseError(parsePgError(pgError), pgError);
    }

    // Return the updated statuses
    const statuses = await sql`
        SELECT ws.*, p.name as product_name, p.brand, p."warrantyExpiry"
        FROM warranty_status ws
        JOIN products p ON ws.product_id = p.id
        WHERE p."userId" = ${userId}
        ORDER BY ws.days_remaining ASC
    ` as any[];

    logger.info(`Bulk warranty status updated for user: ${userId}`);

    res.json({
        success: true,
        message: 'Warranty statuses recalculated successfully.',
        data: statuses,
        count: statuses.length,
    });
});

// POST /api/procedures/purge-expired — Archive & delete products expired beyond threshold
export const purgeExpiredProducts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const { daysPastExpiry = 365 } = req.body;

    const sql = getSQL();

    try {
        await sql`
            CALL sp_purge_expired_products(${userId}, ${Number(daysPastExpiry)})
        `;
    } catch (pgError: any) {
        throw new DatabaseError(parsePgError(pgError), pgError);
    }

    // Return the archived products
    const archived = await sql`
        SELECT * FROM products_archive
        WHERE "userId" = ${userId}
        ORDER BY archived_at DESC
    ` as any[];

    logger.info(`Purge expired products completed for user: ${userId} (threshold: ${daysPastExpiry} days)`);

    res.json({
        success: true,
        message: `Products expired beyond ${daysPastExpiry} days have been archived.`,
        data: archived,
        count: archived.length,
    });
});

// GET /api/procedures/product-report — Get aggregated product statistics
export const getProductReport = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();

    let report: any[];
    try {
        report = await sql`
            SELECT * FROM sp_generate_product_report(${userId})
        ` as any[];
    } catch (pgError: any) {
        throw new DatabaseError(parsePgError(pgError), pgError);
    }

    // Group the report by report_type for cleaner output
    const grouped: Record<string, any[]> = {};
    for (const row of report) {
        if (!grouped[row.report_type]) {
            grouped[row.report_type] = [];
        }
        grouped[row.report_type].push({
            label: row.label,
            value: Number(row.value),
        });
    }

    logger.info(`Product report generated for user: ${userId}`);

    res.json({
        success: true,
        data: grouped,
    });
});
