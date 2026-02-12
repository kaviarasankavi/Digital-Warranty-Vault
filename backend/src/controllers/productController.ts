import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getDB } from '../config/database-sqlite';
import { logger } from '../utils/logger';

// GET /api/products — List all products for the authenticated user
export const getProducts = (req: AuthRequest, res: Response): void => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const db = getDB();
        const products = db
            .prepare('SELECT * FROM products WHERE userId = ? ORDER BY createdAt DESC')
            .all(userId);

        res.json({ success: true, data: products });
    } catch (error) {
        logger.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch products.' });
    }
};

// GET /api/products/:id — Get a single product
export const getProduct = (req: AuthRequest, res: Response): void => {
    try {
        const userId = req.user?._id?.toString();
        const { id } = req.params;

        const db = getDB();
        const product = db
            .prepare('SELECT * FROM products WHERE id = ? AND userId = ?')
            .get(id, userId);

        if (!product) {
            res.status(404).json({ success: false, message: 'Product not found.' });
            return;
        }

        res.json({ success: true, data: product });
    } catch (error) {
        logger.error('Get product error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch product.' });
    }
};

// POST /api/products — Create a new product
export const createProduct = (req: AuthRequest, res: Response): void => {
    try {
        const userId = req.user?._id?.toString();
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
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
            res.status(400).json({ success: false, message: 'Product name is required.' });
            return;
        }

        const db = getDB();
        const stmt = db.prepare(`
            INSERT INTO products (userId, name, brand, model, serialNumber, category, purchaseDate, purchasePrice, warrantyExpiry, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            userId,
            name.trim(),
            brand || '',
            model || '',
            serialNumber || '',
            category || '',
            purchaseDate || '',
            purchasePrice || 0,
            warrantyExpiry || '',
            notes || ''
        );

        const product = db
            .prepare('SELECT * FROM products WHERE id = ?')
            .get(result.lastInsertRowid);

        logger.info(`Product created: ${name} (user: ${userId})`);

        res.status(201).json({
            success: true,
            message: 'Product added successfully.',
            data: product,
        });
    } catch (error) {
        logger.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Failed to create product.' });
    }
};

// PUT /api/products/:id — Update a product
export const updateProduct = (req: AuthRequest, res: Response): void => {
    try {
        const userId = req.user?._id?.toString();
        const { id } = req.params;

        const db = getDB();

        // Check ownership
        const existing = db
            .prepare('SELECT * FROM products WHERE id = ? AND userId = ?')
            .get(id, userId);

        if (!existing) {
            res.status(404).json({ success: false, message: 'Product not found.' });
            return;
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
            res.status(400).json({ success: false, message: 'Product name is required.' });
            return;
        }

        db.prepare(`
            UPDATE products
            SET name = ?, brand = ?, model = ?, serialNumber = ?, category = ?,
                purchaseDate = ?, purchasePrice = ?, warrantyExpiry = ?, notes = ?,
                updatedAt = datetime('now')
            WHERE id = ? AND userId = ?
        `).run(
            name.trim(),
            brand || '',
            model || '',
            serialNumber || '',
            category || '',
            purchaseDate || '',
            purchasePrice || 0,
            warrantyExpiry || '',
            notes || '',
            id,
            userId
        );

        const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

        logger.info(`Product updated: ${name} (id: ${id})`);

        res.json({
            success: true,
            message: 'Product updated successfully.',
            data: updated,
        });
    } catch (error) {
        logger.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Failed to update product.' });
    }
};

// DELETE /api/products/:id — Delete a product
export const deleteProduct = (req: AuthRequest, res: Response): void => {
    try {
        const userId = req.user?._id?.toString();
        const { id } = req.params;

        const db = getDB();

        // Check ownership
        const existing = db
            .prepare('SELECT * FROM products WHERE id = ? AND userId = ?')
            .get(id, userId);

        if (!existing) {
            res.status(404).json({ success: false, message: 'Product not found.' });
            return;
        }

        db.prepare('DELETE FROM products WHERE id = ? AND userId = ?').run(id, userId);

        logger.info(`Product deleted: id ${id} (user: ${userId})`);

        res.json({
            success: true,
            message: 'Product deleted successfully.',
        });
    } catch (error) {
        logger.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete product.' });
    }
};
