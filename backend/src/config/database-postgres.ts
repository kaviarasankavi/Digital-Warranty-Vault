import { neon } from '@neondatabase/serverless';
import { env } from './env';
import { logger } from '../utils/logger';
import { initTriggers } from './triggers';
import { initProcedures } from './procedures';

let sql: ReturnType<typeof neon>;

export async function initPostgres(): Promise<void> {
    if (!env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not set in environment variables');
    }

    sql = neon(env.DATABASE_URL);

    try {
        // Test connection
        await sql`SELECT 1`;
        logger.info('PostgreSQL (Neon) connected successfully');

        // Create products table
        await sql`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                "userId" VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                brand VARCHAR(255) DEFAULT '',
                model VARCHAR(255) DEFAULT '',
                "serialNumber" VARCHAR(255) DEFAULT '',
                category VARCHAR(255) DEFAULT '',
                "purchaseDate" VARCHAR(255) DEFAULT '',
                "purchasePrice" NUMERIC(10, 2) DEFAULT 0,
                "warrantyExpiry" VARCHAR(255) DEFAULT '',
                notes TEXT DEFAULT '',
                "createdAt" TIMESTAMP DEFAULT NOW(),
                "updatedAt" TIMESTAMP DEFAULT NOW()
            )
        `;

        // Create index on userId for fast lookups
        await sql`
            CREATE INDEX IF NOT EXISTS idx_products_userId ON products("userId")
        `;

        logger.info('PostgreSQL tables initialized');

        // Initialize PL/pgSQL triggers and supporting tables
        await initTriggers(sql);

        // Initialize PL/pgSQL stored procedures
        await initProcedures(sql);

    } catch (error) {
        logger.error('PostgreSQL connection failed:', error);
        throw error;
    }
}

export function getSQL(): ReturnType<typeof neon> {
    if (!sql) {
        throw new Error('PostgreSQL not initialized. Call initPostgres() first.');
    }
    return sql;
}
