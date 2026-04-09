import api from './axios';

export interface AuditLog {
    id: number;
    user_id: string;
    user_name: string;
    user_email: string;
    action: string;
    product_id: number;
    product_name: string;
    old_data: any;
    new_data: any;
    performed_at: string;
}

export interface AuditLogStats {
    totalLogs: number;
    actionCounts: { action: string; count: number }[];
    activeUsers: { 
        user_id: string; 
        user_name: string; 
        user_email: string; 
        total_actions: number;
        inserts: number;
        updates: number;
        deletes: number;
    }[];
    recentActivity: AuditLog[];
}

export interface AuditLogsResponse {
    success: boolean;
    data: AuditLog[];
    pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface AuditLogStatsResponse {
    success: boolean;
    data: AuditLogStats;
}

export const auditApi = {
    getLogs: async (params?: Record<string, any>): Promise<AuditLogsResponse> => {
        const queryParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== null) {
                    queryParams.set(key, String(value));
                }
            });
        }
        const queryString = queryParams.toString();
        const url = queryString ? `/audit-logs?${queryString}` : '/audit-logs';
        const res = await api.get<AuditLogsResponse>(url);
        return res.data;
    },

    getStats: async (): Promise<AuditLogStatsResponse> => {
        const res = await api.get<AuditLogStatsResponse>('/audit-logs/stats');
        return res.data;
    },
};
