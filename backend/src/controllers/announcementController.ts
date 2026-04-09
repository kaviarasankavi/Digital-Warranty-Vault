import { Request, Response } from 'express';
import { getMySQLPool } from '../config/database-mysql';
import { asyncHandler } from '../utils/asyncHandler';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ─── PUBLIC: Get active announcements (no auth needed) ────────────────────────
export const getActiveAnnouncements = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT id, message, link_text, link_url, bg_color, text_color
         FROM announcements
         WHERE is_active = TRUE
         ORDER BY priority DESC, created_at DESC`
    );

    res.json({ success: true, data: rows });
});

// ─── ADMIN: Get all announcements ─────────────────────────────────────────────
export const getAllAnnouncements = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM announcements ORDER BY priority DESC, created_at DESC`
    );

    res.json({ success: true, data: rows });
});

// ─── ADMIN: Create announcement ───────────────────────────────────────────────
export const createAnnouncement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();
    const { message, link_text, link_url, bg_color, text_color, is_active, priority } = req.body;

    if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Announcement message is required.' });
        return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO announcements (message, link_text, link_url, bg_color, text_color, is_active, priority)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            message.trim(),
            link_text || null,
            link_url || null,
            bg_color || '#6366f1',
            text_color || '#ffffff',
            is_active !== undefined ? is_active : true,
            priority || 0,
        ]
    );

    // Fetch the newly created record
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM announcements WHERE id = ?`,
        [result.insertId]
    );

    res.status(201).json({
        success: true,
        message: 'Announcement created successfully.',
        data: rows[0],
    });
});

// ─── ADMIN: Update announcement ───────────────────────────────────────────────
export const updateAnnouncement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();
    const { id } = req.params;
    const { message, link_text, link_url, bg_color, text_color, is_active, priority } = req.body;

    if (!message || !message.trim()) {
        res.status(400).json({ success: false, message: 'Announcement message is required.' });
        return;
    }

    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE announcements
         SET message = ?, link_text = ?, link_url = ?, bg_color = ?, text_color = ?, is_active = ?, priority = ?
         WHERE id = ?`,
        [
            message.trim(),
            link_text || null,
            link_url || null,
            bg_color || '#6366f1',
            text_color || '#ffffff',
            is_active !== undefined ? is_active : true,
            priority || 0,
            id,
        ]
    );

    if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Announcement not found.' });
        return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM announcements WHERE id = ?`,
        [id]
    );

    res.json({
        success: true,
        message: 'Announcement updated successfully.',
        data: rows[0],
    });
});

// ─── ADMIN: Delete announcement ───────────────────────────────────────────────
export const deleteAnnouncement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>(
        `DELETE FROM announcements WHERE id = ?`,
        [id]
    );

    if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Announcement not found.' });
        return;
    }

    res.json({
        success: true,
        message: 'Announcement deleted successfully.',
    });
});

// ─── ADMIN: Toggle active status ──────────────────────────────────────────────
export const toggleAnnouncement = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const pool = getMySQLPool();
    const { id } = req.params;

    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE announcements SET is_active = NOT is_active WHERE id = ?`,
        [id]
    );

    if (result.affectedRows === 0) {
        res.status(404).json({ success: false, message: 'Announcement not found.' });
        return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM announcements WHERE id = ?`,
        [id]
    );

    res.json({
        success: true,
        message: `Announcement ${rows[0]?.is_active ? 'activated' : 'deactivated'} successfully.`,
        data: rows[0],
    });
});
