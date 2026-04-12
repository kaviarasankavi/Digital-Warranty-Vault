import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, BadgeCheck, Loader2, PlayCircle, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../api/axios';
import './AdminAuthenticity.css';

interface VerificationRecord {
    _id: string;
    productName: string;
    brand: string;
    serialNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    vendorEmail: string;
    status: 'pending' | 'verified' | 'rejected';
    requestedAt: string;
    verifiedAt: string | null;
}

const fmtDate = (d: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + 
           ' ' + new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export default function AdminAuthenticity() {
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 25;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-verifications', page, limit, search, status],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                search,
                status
            });
            const res = await api.get(`/admin/verifications?${params}`);
            return res.data;
        }
    });

    const records: VerificationRecord[] = data?.data || [];
    const summary = data?.summary || { total: 0, pending: 0, verified: 0, rejected: 0 };
    const pagination = data?.pagination;

    return (
        <div className="aauth-page">
            <div className="aauth-header">
                <div>
                    <h1 className="aauth-title">Authenticity <span className="aauth-accent">Log</span></h1>
                    <p className="aauth-sub">Full audit trail of all serial verification checks across all vendors</p>
                </div>
            </div>

            {/* Stats row */}
            <div className="aauth-summary">
                <div className="aauth-card aauth-card-indigo">
                    <div className="aauth-card-val">{isLoading ? '—' : summary.total}</div>
                    <div className="aauth-card-label">Total Requests</div>
                </div>
                <div className="aauth-card aauth-card-teal">
                    <div className="aauth-card-val">{isLoading ? '—' : summary.verified}</div>
                    <div className="aauth-card-label">Verified Authentic</div>
                </div>
                <div className="aauth-card aauth-card-amber">
                    <div className="aauth-card-val">{isLoading ? '—' : summary.pending}</div>
                    <div className="aauth-card-label">Pending Review</div>
                </div>
                <div className="aauth-card aauth-card-coral">
                    <div className="aauth-card-val">{isLoading ? '—' : summary.rejected}</div>
                    <div className="aauth-card-label">Rejected / Flagged</div>
                </div>
            </div>

            {/* Filters */}
            <div className="aauth-filters">
                <div className="aauth-search">
                    <Search size={14} />
                    <input 
                        type="text" 
                        placeholder="Search by product, user, brand or vendor..." 
                        value={search} 
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                    />
                </div>
                <select className="aauth-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Table */}
            {isError ? (
                <div className="aauth-error">Failed to load verification logs.</div>
            ) : isLoading ? (
                <div className="aauth-loading"><Loader2 size={32} className="aauth-spinner" /></div>
            ) : (
                <div className="aauth-table-wrap">
                    <table className="aauth-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Brand / Serial</th>
                                <th>User</th>
                                <th>Vendor</th>
                                <th>Requested At</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="aauth-empty">No verification records found.</td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r._id}>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#fff' }}>{r.productName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>ID: {r._id.slice(-6).toUpperCase()}</div>
                                        </td>
                                        <td>
                                            <div style={{ color: '#fff' }}>{r.brand}</div>
                                            <div className="aauth-mono" style={{ fontSize: '0.75rem', marginTop: 2 }}>{r.serialNumber || '—'}</div>
                                        </td>
                                        <td>
                                            <div style={{ color: '#fff' }}>{r.userName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{r.userEmail}</div>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.6)' }}>{r.vendorEmail}</td>
                                        <td>
                                            {fmtDate(r.requestedAt)}
                                            {r.verifiedAt && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Updated: {fmtDate(r.verifiedAt)}</div>}
                                        </td>
                                        <td>
                                            {r.status === 'verified' && <span className="aauth-badge aauth-badge-green"><CheckCircle size={10}/> Verified</span>}
                                            {r.status === 'pending' && <span className="aauth-badge aauth-badge-amber"><Clock size={10}/> Pending</span>}
                                            {r.status === 'rejected' && <span className="aauth-badge aauth-badge-red"><XCircle size={10}/> Rejected</span>}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="aauth-pagination">
                            <span className="aauth-page-info">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} records
                            </span>
                            <div className="aauth-page-btns">
                                <button className="aauth-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button className="aauth-page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
