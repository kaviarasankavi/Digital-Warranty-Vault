import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Search, UserCircle, ShieldAlert, RefreshCw, Users,
    UserCheck, UserX, Shield, Package, BadgeCheck,
    CalendarPlus, Wrench, Award, ChevronDown, ChevronUp,
    Ban, CheckCircle,
} from 'lucide-react';
import api from '../../api/axios';
import './AdminUsers.css';

interface UserRow {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    suspended?: boolean;
}

interface UserDetails {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    suspended?: boolean;
    stats: {
        products: number;
        verifications: number;
        extensions: number;
        claims: number;
        certificates: number;
    };
}

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminUsers() {
    const qc = useQueryClient();
    const [search,    setSearch]    = useState('');
    const [role,      setRole]      = useState('all');
    const [timeframe, setTimeframe] = useState('all');
    const [page,      setPage]      = useState(1);
    const [expanded,  setExpanded]  = useState<string | null>(null);
    const [toast,     setToast]     = useState<{ ok: boolean; text: string } | null>(null);
    const limit = 10;

    const showToast = (ok: boolean, text: string) => {
        setToast({ ok, text });
        setTimeout(() => setToast(null), 3500);
    };

    // ── User list ──
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-users', page, search, role, timeframe],
        queryFn: async () => {
            const p = new URLSearchParams({ page: String(page), limit: String(limit), search, role, timeframe });
            const res = await api.get(`/users?${p}`);
            return res.data;
        },
    });

    // ── User details (expanded row) ──
    const { data: detailData } = useQuery({
        queryKey: ['admin-user-details', expanded],
        queryFn: async () => {
            const res = await api.get(`/admin/users/${expanded}/details`);
            return res.data.data as UserDetails;
        },
        enabled: !!expanded,
    });

    // ── Suspend ──
    const suspendMut = useMutation({
        mutationFn: async (id: string) => api.patch(`/admin/users/${id}/suspend`),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-user-details', id] });
            showToast(true, 'User suspended.');
        },
        onError: (e: any) => showToast(false, e?.response?.data?.message ?? 'Failed.'),
    });

    const unsuspendMut = useMutation({
        mutationFn: async (id: string) => api.patch(`/admin/users/${id}/unsuspend`),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: ['admin-users'] });
            qc.invalidateQueries({ queryKey: ['admin-user-details', id] });
            showToast(true, 'User reinstated.');
        },
        onError: (e: any) => showToast(false, e?.response?.data?.message ?? 'Failed.'),
    });

    const users: UserRow[]  = data?.data || [];
    const pagination        = data?.pagination;
    const totalCount        = pagination?.totalCount ?? 0;

    // Summary counts from current page
    const pageUsers   = users.filter(u => u.role === 'user').length;
    const pageVendors = users.filter(u => u.role === 'vendor').length;

    return (
        <div className="au-page">
            {/* Header */}
            <div className="au-header">
                <div>
                    <h1 className="au-title">User <span className="au-accent">Management</span></h1>
                    <p className="au-sub">View, search, and manage all registered users on the platform</p>
                </div>
                <button className="au-refresh" onClick={() => refetch()}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`au-toast ${toast.ok ? 'au-toast-ok' : 'au-toast-err'}`}>
                    {toast.ok ? <CheckCircle size={13}/> : <ShieldAlert size={13}/>} {toast.text}
                </div>
            )}

            {/* Summary cards */}
            <div className="au-summary">
                {[
                    { icon: Users,     color: 'indigo',  label: 'Total',   val: totalCount },
                    { icon: UserCheck, color: 'teal',    label: 'Users',   val: users.filter(u=>u.role==='user').length },
                    { icon: Shield,    color: 'amber',   label: 'Vendors', val: users.filter(u=>u.role==='vendor').length },
                    { icon: UserX,     color: 'coral',   label: 'Suspended', val: users.filter(u=>u.suspended).length },
                ].map(({ icon: Icon, color, label, val }) => (
                    <div key={label} className={`au-card au-card-${color}`}>
                        <div className="au-card-icon"><Icon size={18}/></div>
                        <div className="au-card-val">{isLoading ? '…' : val}</div>
                        <div className="au-card-label">{label}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="au-filters">
                <div className="au-search">
                    <Search size={14}/>
                    <input
                        placeholder="Search by name or email…"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <select className="au-select" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
                    <option value="all">All Roles</option>
                    <option value="user">User</option>
                    <option value="vendor">Vendor</option>
                    <option value="admin">Admin</option>
                </select>
                <select className="au-select" value={timeframe} onChange={e => { setTimeframe(e.target.value); setPage(1); }}>
                    <option value="all">All Time</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                </select>
            </div>

            {/* Table */}
            {isError ? (
                <div className="au-error"><ShieldAlert size={32}/><p>Failed to load users.</p></div>
            ) : isLoading ? (
                <div className="au-loading"><div className="au-spinner"/></div>
            ) : (
                <div className="au-table-wrap">
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={7} className="au-empty">No users found.</td></tr>
                            ) : users.map(user => (
                                <>
                                    <tr key={user._id} className={user.suspended ? 'au-row-suspended' : ''}>
                                        {/* Expand toggle */}
                                        <td>
                                            <button
                                                className="au-expand-btn"
                                                onClick={() => setExpanded(expanded === user._id ? null : user._id)}
                                            >
                                                {expanded === user._id ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="au-user-cell">
                                                <div className="au-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                                <span className="au-user-name">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="au-email">{user.email}</td>
                                        <td><span className={`au-role au-role-${user.role}`}>{user.role}</span></td>
                                        <td className="au-date">{fmtDate(user.createdAt)}</td>
                                        <td>
                                            <span className={`au-status ${user.suspended ? 'au-suspended' : 'au-active'}`}>
                                                {user.suspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td>
                                            {user.role !== 'admin' && (
                                                user.suspended ? (
                                                    <button
                                                        className="au-action-btn au-unsuspend"
                                                        onClick={() => unsuspendMut.mutate(user._id)}
                                                        disabled={unsuspendMut.isPending}
                                                    >
                                                        <CheckCircle size={12}/> Reinstate
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="au-action-btn au-suspend"
                                                        onClick={() => suspendMut.mutate(user._id)}
                                                        disabled={suspendMut.isPending}
                                                    >
                                                        <Ban size={12}/> Suspend
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>

                                    {/* Expanded detail row */}
                                    {expanded === user._id && (
                                        <tr key={`${user._id}-detail`} className="au-detail-row">
                                            <td colSpan={7}>
                                                {!detailData ? (
                                                    <div className="au-detail-loading"><div className="au-spinner-sm"/></div>
                                                ) : (
                                                    <div className="au-detail">
                                                        <div className="au-detail-title">Activity Overview</div>
                                                        <div className="au-detail-stats">
                                                            {[
                                                                { icon: Package,     label: 'Products',       val: detailData.stats.products       },
                                                                { icon: BadgeCheck,  label: 'Verifications',  val: detailData.stats.verifications  },
                                                                { icon: CalendarPlus,label: 'Extensions',     val: detailData.stats.extensions     },
                                                                { icon: Wrench,      label: 'Claims',         val: detailData.stats.claims         },
                                                                { icon: Award,       label: 'Certificates',   val: detailData.stats.certificates   },
                                                            ].map(({ icon: Icon, label, val }) => (
                                                                <div key={label} className="au-detail-stat">
                                                                    <Icon size={14}/>
                                                                    <span className="au-ds-val">{val}</span>
                                                                    <span className="au-ds-lbl">{label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="au-pagination">
                            <span className="au-page-info">
                                Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} users
                            </span>
                            <div className="au-page-btns">
                                <button className="au-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                                <button className="au-page-btn" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
