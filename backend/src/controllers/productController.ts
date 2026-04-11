import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSQL } from '../config/database-postgres';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/asyncHandler';
import {
    AuthenticationError,
    ValidationError,
    NotFoundError,
    ConflictError,
} from '../utils/errors';
import { logAuditEvent } from '../services/auditLogService';

// ─── Allowed sort columns (whitelist to prevent SQL injection) ─────────
const ALLOWED_SORT_COLUMNS: Record<string, string> = {
    name: 'name',
    purchasePrice: '"purchasePrice"',
    purchaseDate: '"purchaseDate"',
    warrantyExpiry: '"warrantyExpiry"',
    createdAt: '"createdAt"',
};

// GET /api/products — List products with server-side search, filter, sort & pagination
export const getProducts = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    // ── Parse query params ──
    const {
        search,
        category,
        warrantyStatus,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '12',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '12', 10)));
    const offset = (pageNum - 1) * limitNum;

    // ── Validate sortBy against whitelist ──
    const sortColumn = ALLOWED_SORT_COLUMNS[sortBy || 'createdAt'] || '"createdAt"';
    const sortDir = sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const sql = getSQL();

    // ── Build dynamic parameterized query ──
    let conditions = `WHERE p."userId" = $1`;
    const params: any[] = [userId];
    let paramIndex = 2;

    // Search (name, brand, serialNumber)
    if (search && search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        conditions += ` AND (p.name ILIKE $${paramIndex} OR p.brand ILIKE $${paramIndex} OR p."serialNumber" ILIKE $${paramIndex})`;
        params.push(searchPattern);
        paramIndex++;
    }

    // Category filter
    if (category && category.trim()) {
        conditions += ` AND p.category = $${paramIndex}`;
        params.push(category.trim());
        paramIndex++;
    }

    // Price range
    if (minPrice) {
        const min = parseFloat(minPrice);
        if (!isNaN(min)) {
            conditions += ` AND p."purchasePrice" >= $${paramIndex}`;
            params.push(min);
            paramIndex++;
        }
    }
    if (maxPrice) {
        const max = parseFloat(maxPrice);
        if (!isNaN(max)) {
            conditions += ` AND p."purchasePrice" <= $${paramIndex}`;
            params.push(max);
            paramIndex++;
        }
    }

    // Warranty status filter (requires JOIN with warranty_status table)
    let joinClause = '';
    if (warrantyStatus && warrantyStatus.trim()) {
        joinClause = ` LEFT JOIN warranty_status ws ON ws.product_id = p.id`;
        conditions += ` AND ws.status = $${paramIndex}`;
        params.push(warrantyStatus.trim());
        paramIndex++;
    }

    // ── Count query (for pagination) ──
    const countQuery = `SELECT COUNT(*) as total FROM products p${joinClause} ${conditions}`;
    const countResult = await sql.query(countQuery, params) as any;
    const totalCount = parseInt(countResult[0]?.total || '0', 10);
    const totalPages = Math.ceil(totalCount / limitNum);

    // ── Data query ──
    const dataParams = [...params, limitNum, offset];
    const dataQuery = `SELECT p.* FROM products p${joinClause} ${conditions} ORDER BY p.${sortColumn} ${sortDir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    const products = await sql.query(dataQuery, dataParams) as any;

    res.json({
        success: true,
        data: products,
        pagination: {
            page: pageNum,
            limit: limitNum,
            totalCount,
            totalPages,
        },
    });
});

// GET /api/products/categories — Get distinct categories for filter dropdown
export const getCategories = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const sql = getSQL();
    const categories = await sql`
        SELECT DISTINCT category FROM products
        WHERE "userId" = ${userId} AND category != ''
        ORDER BY category ASC
    ` as any[];

    res.json({
        success: true,
        data: categories.map((c: any) => c.category),
    });
});

// GET /api/products/:id — Get a single product
export const getProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const id = req.params.id as string;

    // Validate that id is numeric to prevent SQL type errors
    if (!/^\d+$/.test(id)) {
        throw new NotFoundError('Product');
    }

    const sql = getSQL();
    const products = await sql`
        SELECT * FROM products WHERE id = ${id} AND "userId" = ${userId}
    ` as any[];

    if (products.length === 0) {
        throw new NotFoundError('Product');
    }

    res.json({ success: true, data: products[0] });
});

// GET /api/products/:id/history — Get the product audit and price history from Postgres triggers
export const getProductHistory = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const id = req.params.id as string;

    if (!/^\d+$/.test(id)) {
        throw new NotFoundError('Product');
    }

    const sql = getSQL();

    // Verify ownership
    const products = await sql`
        SELECT id FROM products WHERE id = ${id} AND "userId" = ${userId}
    ` as any[];

    if (products.length === 0) {
        throw new NotFoundError('Product');
    }

    // 1. Fetch from product_audit_log
    const auditLogs = await sql`
        SELECT 
            'AUDIT' as event_type, 
            action, 
            changed_at as timestamp, 
            old_data, 
            new_data
        FROM product_audit_log 
        WHERE product_id = ${id}
        ORDER BY changed_at DESC
    ` as any[];

    // 2. Fetch from price_change_history
    const priceLogs = await sql`
        SELECT 
            'PRICE_CHANGE' as event_type, 
            'UPDATE' as action, 
            changed_at as timestamp, 
            old_price, 
            new_price
        FROM price_change_history 
        WHERE product_id = ${id}
        ORDER BY changed_at DESC
    ` as any[];

    // Combine and sort (newest first)
    const combinedHistory = [...auditLogs, ...priceLogs].sort((a, b) => {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    res.json({
        success: true,
        data: combinedHistory
    });
});

// POST /api/products — Create a new product
export const createProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
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

    // ── Field Validations ──
    if (!name || !name.trim()) {
        throw new ValidationError('Product name is required.');
    }
    if (name.trim().length < 2) {
        throw new ValidationError('Product name must be at least 2 characters.');
    }
    if (!brand || !brand.trim()) {
        throw new ValidationError('Brand is required.');
    }
    if (!model || !model.trim()) {
        throw new ValidationError('Model is required.');
    }
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') {
        const price = parseFloat(purchasePrice);
        if (isNaN(price) || price < 0) {
            throw new ValidationError('Purchase price must be a non-negative number.');
        }
    }
    const sql = getSQL();

    const result = await sql`
        INSERT INTO products ("userId", name, brand, model, "serialNumber", category, "purchaseDate", "purchasePrice", "warrantyExpiry", notes)
        VALUES (${userId}, ${name.trim()}, ${brand || ''}, ${model || ''}, ${serialNumber?.trim() || ''}, ${category || ''}, ${purchaseDate || null}, ${purchasePrice || 0}, ${warrantyExpiry || null}, ${notes || ''})
        RETURNING *
    ` as any[];

    logger.info(`Product created: ${name} (user: ${userId})`);

    // ── Audit Log ──
    logAuditEvent({
        userId,
        userName: req.user?.name || 'Unknown',
        userEmail: req.user?.email || 'unknown',
        action: 'INSERT',
        productId: result[0]?.id,
        productName: name.trim(),
        oldData: null,
        newData: result[0],
        ipAddress: req.ip,
    });

    res.status(201).json({
        success: true,
        message: 'Product added successfully.',
        data: result[0],
    });
});

// PUT /api/products/:id — Update a product
export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const { id } = req.params;

    const sql = getSQL();

    // Check ownership
    const existing = await sql`
        SELECT * FROM products WHERE id = ${id} AND "userId" = ${userId}
    ` as any[];

    if (existing.length === 0) {
        throw new NotFoundError('Product');
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

    // ── Field Validations ──
    if (!name || !name.trim()) {
        throw new ValidationError('Product name is required.');
    }
    if (name.trim().length < 2) {
        throw new ValidationError('Product name must be at least 2 characters.');
    }
    if (!brand || !brand.trim()) {
        throw new ValidationError('Brand is required.');
    }
    if (!model || !model.trim()) {
        throw new ValidationError('Model is required.');
    }
    if (purchasePrice !== undefined && purchasePrice !== null && purchasePrice !== '') {
        const price = parseFloat(purchasePrice);
        if (isNaN(price) || price < 0) {
            throw new ValidationError('Purchase price must be a non-negative number.');
        }
    }


    const result = await sql`
        UPDATE products
        SET name = ${name.trim()}, brand = ${brand || ''}, model = ${model || ''}, 
            "serialNumber" = ${serialNumber?.trim() || ''}, category = ${category || ''},
            "purchaseDate" = ${purchaseDate || null}, "purchasePrice" = ${purchasePrice || 0}, 
            "warrantyExpiry" = ${warrantyExpiry || null}, notes = ${notes || ''},
            "updatedAt" = NOW()
        WHERE id = ${id} AND "userId" = ${userId}
        RETURNING *
    ` as any[];

    logger.info(`Product updated: ${name} (id: ${id})`);

    // ── Audit Log ──
    logAuditEvent({
        userId,
        userName: req.user?.name || 'Unknown',
        userEmail: req.user?.email || 'unknown',
        action: 'UPDATE',
        productId: parseInt(String(id), 10),
        productName: name.trim(),
        oldData: existing[0],
        newData: result[0],
        ipAddress: req.ip,
    });

    res.json({
        success: true,
        message: 'Product updated successfully.',
        data: result[0],
    });
});

// DELETE /api/products/:id — Delete a product
export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new AuthenticationError('Unauthorized');
    }

    const { id } = req.params;

    const sql = getSQL();

    // Check ownership
    const existing = await sql`
        SELECT * FROM products WHERE id = ${id} AND "userId" = ${userId}
    ` as any[];

    if (existing.length === 0) {
        throw new NotFoundError('Product');
    }

    await sql`
        DELETE FROM products WHERE id = ${id} AND "userId" = ${userId}
    `;

    logger.info(`Product deleted: id ${id} (user: ${userId})`);

    // ── Audit Log ──
    logAuditEvent({
        userId,
        userName: req.user?.name || 'Unknown',
        userEmail: req.user?.email || 'unknown',
        action: 'DELETE',
        productId: parseInt(String(id), 10),
        productName: existing[0]?.name || 'Unknown',
        oldData: existing[0],
        newData: null,
        ipAddress: req.ip,
    });

    res.json({
        success: true,
        message: 'Product deleted successfully.',
    });
});
