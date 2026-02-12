import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

const DATA_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'warrantyvault.db');

let db: Database.Database;

export function initSQLite(): Database.Database {
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    db = new Database(DB_PATH);

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create products table
    db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId TEXT NOT NULL,
            name TEXT NOT NULL,
            brand TEXT DEFAULT '',
            model TEXT DEFAULT '',
            serialNumber TEXT DEFAULT '',
            category TEXT DEFAULT '',
            purchaseDate TEXT DEFAULT '',
            purchasePrice REAL DEFAULT 0,
            warrantyExpiry TEXT DEFAULT '',
            notes TEXT DEFAULT '',
            createdAt TEXT DEFAULT (datetime('now')),
            updatedAt TEXT DEFAULT (datetime('now'))
        )
    `);

    // Create index on userId for fast lookups
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_products_userId ON products(userId)
    `);

    logger.info(`SQLite database initialized at ${DB_PATH}`);
    return db;
}

export function getDB(): Database.Database {
    if (!db) {
        throw new Error('SQLite not initialized. Call initSQLite() first.');
    }
    return db;
}
