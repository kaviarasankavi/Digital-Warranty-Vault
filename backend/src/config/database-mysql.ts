import mysql from 'mysql2/promise';
import { env } from './env';
import { logger } from '../utils/logger';

let pool: mysql.Pool;

/**
 * Initialize MySQL connection pool and create the audit database + table.
 */
export async function initMySQL(): Promise<void> {
    try {
        // ── Step 1: Connect without specifying a database to create it if needed ──
        const bootstrapPool = mysql.createPool({
            host: env.MYSQL_HOST,
            port: env.MYSQL_PORT,
            user: env.MYSQL_USER,
            password: env.MYSQL_PASSWORD,
            waitForConnections: true,
            connectionLimit: 5,
        });

        await bootstrapPool.query(
            `CREATE DATABASE IF NOT EXISTS \`${env.MYSQL_DATABASE}\``
        );
        await bootstrapPool.end();

        // ── Step 2: Create the main pool targeting the audit database ──
        pool = mysql.createPool({
            host: env.MYSQL_HOST,
            port: env.MYSQL_PORT,
            user: env.MYSQL_USER,
            password: env.MYSQL_PASSWORD,
            database: env.MYSQL_DATABASE,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        // Test connection
        const connection = await pool.getConnection();
        connection.release();

        // ── Step 3: Create the user_audit_log table ──
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_audit_log (
                id            INT AUTO_INCREMENT PRIMARY KEY,
                user_id       VARCHAR(255) NOT NULL,
                user_name     VARCHAR(255) NOT NULL,
                user_email    VARCHAR(255) NOT NULL,
                action        ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
                product_id    INT,
                product_name  VARCHAR(255),
                old_data      JSON DEFAULT NULL,
                new_data      JSON DEFAULT NULL,
                ip_address    VARCHAR(45),
                performed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_performed_at (performed_at),
                INDEX idx_product_id (product_id)
            )
        `);

        logger.info('MySQL (Audit Log) connected successfully');
        logger.info('MySQL audit table initialized');
    } catch (error) {
        logger.error('MySQL connection failed:', error);
        throw error;
    }
}

/**
 * Get the MySQL connection pool.
 */
export function getMySQLPool(): mysql.Pool {
    if (!pool) {
        throw new Error('MySQL not initialized. Call initMySQL() first.');
    }
    return pool;
}
