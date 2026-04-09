import { useState, useEffect } from 'react';
import {
    Activity,
    Database,
    Clock,
    User,
    PlusCircle,
    Edit3,
    Trash2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { auditApi, AuditLog, AuditLogStats } from '../../api/auditApi';
import { Pagination as PaginationParams } from '../../api/productApi';
import './AdminAuditLogs.css';

export default function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditLogStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationParams>({
        page: 1, limit: 20, totalCount: 0, totalPages: 1
    });

    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async (page = 1, currentAction = actionFilter) => {
        try {
            setLoading(true);
            const params: Record<string, any> = { page, limit: 20 };
            if (currentAction) params.action = currentAction;

            const [logsRes, statsRes] = await Promise.all([
                auditApi.getLogs(params),
                auditApi.getStats()
            ]);

            setLogs(logsRes.data);
            setPagination(logsRes.pagination);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1, actionFilter);
    }, [actionFilter]);

    const handlePageChange = (page: number) => fetchLogs(page);

    const getActionBadge = (action: string) => {
        const type = action.toUpperCase();
        if (type === 'INSERT') return <span className="audit-badge insert"><PlusCircle size={12}/> INSERT</span>;
        if (type === 'UPDATE') return <span className="audit-badge update"><Edit3 size={12}/> UPDATE</span>;
        if (type === 'DELETE') return <span className="audit-badge delete"><Trash2 size={12}/> DELETE</span>;
        return <span className="audit-badge">{action}</span>;
    };

    const getChangeDetails = (log: AuditLog) => {
        if (log.action === 'INSERT') {
            return (
                <div style={{ color: '#10b981', fontWeight: 500 }}>+ Created new product record</div>
            );
        }
        if (log.action === 'DELETE') {
            return (
                <div style={{ color: '#f43f5e', fontWeight: 500 }}>- Deleted product record entirely</div>
            );
        }
        
        let oldData: any = {};
        let newData: any = {};
        
        try { oldData = typeof log.old_data === 'string' ? JSON.parse(log.old_data) : log.old_data; } catch(e){}
        try { newData = typeof log.new_data === 'string' ? JSON.parse(log.new_data) : log.new_data; } catch(e){}
        
        if (!oldData || !newData) return <div style={{ color: '#94a3b8' }}>Modified (Raw payload unparseable)</div>;

        const changes: { key: string, oldVal: any, newVal: any }[] = [];
        Object.keys(newData).forEach(key => {
            if (oldData[key] !== newData[key] && key !== 'updatedAt') {
                changes.push({ key, oldVal: oldData[key], newVal: newData[key] });
            }
        });

        if (changes.length === 0) return <div style={{ color: '#94a3b8' }}>No visible field changes.</div>;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {changes.map(c => (
                    <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <span style={{ color: '#cbd5e1', fontWeight: 600, minWidth: '90px' }}>{c.key}:</span>
                        <span style={{ textDecoration: 'line-through', color: '#f87171' }}>{String(c.oldVal) || 'empty'}</span>
                        <span style={{ color: '#cbd5e1' }}>→</span>
                        <span style={{ color: '#4ade80' }}>{String(c.newVal) || 'empty'}</span>
                    </div>
                ))}
            </div>
        );
    };

    const inserts = stats?.actionCounts?.find(a => a.action === 'INSERT')?.count || 0;
    const updates = stats?.actionCounts?.find(a => a.action === 'UPDATE')?.count || 0;
    const deletes = stats?.actionCounts?.find(a => a.action === 'DELETE')?.count || 0;
    const topUser = stats?.activeUsers?.[0];

    return (
        <div className="admin-audit-logs">
            <div className="admin-audit-header">
                <div>
                    <h1 className="admin-audit-title">Global System Audit Logs</h1>
                    <p className="admin-audit-sub">Master view of all database modifications intercepted by MySQL triggers</p>
                </div>
                <button className="admin-view-site-btn" onClick={() => fetchLogs(1)} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                    Refresh
                </button>
            </div>

            {/* KPI Stats Grid */}
            <div className="admin-audit-kpi-grid">
                <div className="audit-kpi-card" style={{ '--kpi-color': '#3b82f6', '--kpi-bg': 'rgba(59, 130, 246, 0.1)' } as any}>
                    <div className="audit-kpi-icon"><Database size={24} /></div>
                    <div className="audit-kpi-content">
                        <div className="audit-kpi-label">Total Events Logged</div>
                        <div className="audit-kpi-value">{stats?.totalLogs || 0}</div>
                        <div className="audit-kpi-sub">Lifetime database mutations</div>
                    </div>
                </div>
                <div className="audit-kpi-card" style={{ '--kpi-color': '#10b981', '--kpi-bg': 'rgba(16, 185, 129, 0.1)' } as any}>
                    <div className="audit-kpi-icon"><Activity size={24} /></div>
                    <div className="audit-kpi-content">
                        <div className="audit-kpi-label">Action Breakdown</div>
                        <div className="audit-kpi-value" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                            <span style={{ color: '#10b981' }}>{inserts}</span> I /&nbsp;
                            <span style={{ color: '#3b82f6' }}>{updates}</span> U /&nbsp;
                            <span style={{ color: '#f43f5e' }}>{deletes}</span> D
                        </div>
                        <div className="audit-kpi-sub" style={{ marginTop: '0.4rem' }}>Inserts / Updates / Deletes</div>
                    </div>
                </div>
                <div className="audit-kpi-card" style={{ '--kpi-color': '#f59e0b', '--kpi-bg': 'rgba(245, 158, 11, 0.1)' } as any}>
                    <div className="audit-kpi-icon"><User size={24} /></div>
                    <div className="audit-kpi-content">
                        <div className="audit-kpi-label">Most Active User</div>
                        <div className="audit-kpi-value" style={{ fontSize: '1.25rem', marginTop: '0.25rem' }}>
                            {topUser ? topUser.user_name : 'N/A'}
                        </div>
                        <div className="audit-kpi-sub" style={{ marginTop: '0.4rem' }}>
                            {topUser ? `${topUser.total_actions} total mutations` : '---'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="admin-audit-controls">
                <select 
                    className="audit-filter-input" 
                    value={actionFilter} 
                    onChange={(e) => setActionFilter(e.target.value)}
                >
                    <option value="">All Actions</option>
                    <option value="INSERT">INSERT</option>
                    <option value="UPDATE">UPDATE</option>
                    <option value="DELETE">DELETE</option>
                </select>
            </div>

            {/* Master Table */}
            <div className="admin-audit-table-wrap">
                <table className="admin-audit-table">
                    <thead>
                        <tr>
                            <th>User (Actor)</th>
                            <th>Action</th>
                            <th>Product ID</th>
                            <th>Change Details</th>
                            <th>Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Loading streams...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No audit logs found.</td></tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td>
                                        <div className="audit-user-col">
                                            <span className="audit-user-name">{log.user_name}</span>
                                            <span className="audit-user-email">{log.user_email}</span>
                                            <span className="audit-mono">ID: {log.user_id}</span>
                                        </div>
                                    </td>
                                    <td>{getActionBadge(log.action)}</td>
                                    <td>
                                        <div className="audit-user-col">
                                            <span className="audit-mono">#{log.product_id}</span>
                                            <span className="audit-user-email" style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={log.product_name}>
                                                {log.product_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="audit-data-cell" style={{ maxWidth: '400px' }}>
                                        {getChangeDetails(log)}
                                    </td>
                                    <td className="audit-mono">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px'}}>
                                            <Clock size={12} />
                                            {new Date(log.performed_at).toLocaleString()}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem', padding: '1rem' }}>
                    <button
                        style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '4px', cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer', opacity: pagination.page <= 1 ? 0.5 : 1 }}
                        disabled={pagination.page <= 1}
                        onClick={() => handlePageChange(pagination.page - 1)}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                        style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '0.5rem', borderRadius: '4px', cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page >= pagination.totalPages ? 0.5 : 1 }}
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => handlePageChange(pagination.page + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
