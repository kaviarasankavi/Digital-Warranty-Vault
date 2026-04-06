import { getMySQLPool } from '../config/database-mysql';
import { logger } from '../utils/logger';

export interface AuditLogParams {
    userId: string;
    userName: string;
    userEmail: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    productId?: number;
    productName?: string;
    oldData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
    ipAddress?: string;
}

/**
 * Log a user audit event to MySQL.
 * Fire-and-forget — errors are logged but never thrown to the caller,
 * so product operations are never blocked by audit failures.
 */
export function logAuditEvent(params: AuditLogParams): void {
    const pool = getMySQLPool();

    const query = `
        INSERT INTO user_audit_log
            (user_id, user_name, user_email, action, product_id, product_name, old_data, new_data, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        params.userId,
        params.userName,
        params.userEmail,
        params.action,
        params.productId ?? null,
        params.productName ?? null,
        params.oldData ? JSON.stringify(params.oldData) : null,
        params.newData ? JSON.stringify(params.newData) : null,
        params.ipAddress ?? null,
    ];

    // Fire-and-forget: don't await, just log errors
    pool.execute(query, values).catch((err) => {
        logger.error('Failed to write audit log to MySQL:', err);
    });
}
