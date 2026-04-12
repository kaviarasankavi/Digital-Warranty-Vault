import { useState, useEffect, useCallback } from 'react';
import {
    Calendar, Clock, CheckCircle, XCircle,
    RefreshCw, Package, User, Inbox, Shield,
} from 'lucide-react';
import { warrantyExtensionApi, ExtensionRequest } from '../../api/warrantyExtensionApi';
import { useAuthStore } from '../../store/authStore';
import './VendorExtensions.css';

type Tab = 'pending' | 'approved' | 'denied' | 'all';

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function VendorExtensions() {
    const { user } = useAuthStore();
    const [requests,   setRequests]   = useState<ExtensionRequest[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab,  setActiveTab]  = useState<Tab>('pending');
    const [processing, setProcessing] = useState<string | null>(null);
    const [noteMap,    setNoteMap]    = useState<Record<string, string>>({});
    const [expiryMap,  setExpiryMap]  = useState<Record<string, string>>({});
    const [toast,      setToast]      = useState<{ ok: boolean; text: string } | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await warrantyExtensionApi.getVendorRequests(
                activeTab === 'all' ? undefined : activeTab
            );
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        const id = setInterval(() => load(true), 20000);
        return () => clearInterval(id);
    }, [load]);

    const showToast = (ok: boolean, text: string) => {
        setToast({ ok, text });
        setTimeout(() => setToast(null), 4000);
    };

    const handleApprove = async (req: ExtensionRequest) => {
        const newExpiry = expiryMap[req._id];
        if (!newExpiry) {
            showToast(false, 'Please set a new expiry date before approving.');
            return;
        }
        setProcessing(req._id);
        try {
            await warrantyExtensionApi.approveRequest(req._id, newExpiry, noteMap[req._id] ?? '');
            showToast(true, `Warranty for "${req.productName}" extended to ${fmtDate(newExpiry)}.`);
            load(true);
        } catch (e: any) {
            showToast(false, e?.response?.data?.message ?? 'Failed to approve.');
        } finally {
            setProcessing(null);
        }
    };

    const handleDeny = async (req: ExtensionRequest) => {
        setProcessing(req._id);
        try {
            await warrantyExtensionApi.denyRequest(req._id, noteMap[req._id] ?? '');
            showToast(false, 'Request denied.');
            load(true);
        } catch (e: any) {
            showToast(false, e?.response?.data?.message ?? 'Failed to deny.');
        } finally {
            setProcessing(null);
        }
    };

    const brand = user?.email?.split('@')[1]?.split('.')[0] ?? 'Brand';

    const tabs: { key: Tab; label: string; color: string }[] = [
        { key: 'pending',  label: 'Pending',  color: 'amber' },
        { key: 'approved', label: 'Approved', color: 'teal'  },
        { key: 'denied',   label: 'Denied',   color: 'coral' },
        { key: 'all',      label: 'All',      color: 'slate' },
    ];

    return (
        <div className="ve-page">
            {/* Header */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">
                        Warranty <span className="vd-title-accent">Extensions</span>
                    </h1>
                    <p className="vd-page-sub">
                        Extension requests from customers for{' '}
                        <strong style={{ color: '#2dd4bf', textTransform: 'capitalize' }}>{brand}</strong> products
                    </p>
                </div>
                <button className={`vd-btn-secondary ${refreshing ? 've-refreshing' : ''}`} onClick={() => load(true)}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="ve-tabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`ve-tab ve-tab-${t.color} ${activeTab === t.key ? 've-tab-active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.key === 'pending'  && <Clock       size={13} />}
                        {t.key === 'approved' && <CheckCircle size={13} />}
                        {t.key === 'denied'   && <XCircle     size={13} />}
                        {t.key === 'all'      && <Shield      size={13} />}
                        {t.label}
                        {activeTab === t.key && requests.length > 0 && (
                            <span className="ve-count">{requests.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`ve-toast ${toast.ok ? 've-toast-ok' : 've-toast-err'}`}>
                    {toast.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {toast.text}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="ve-loading"><div className="vd-loader-ring" /> Loading…</div>
            ) : requests.length === 0 ? (
                <div className="ve-empty">
                    <div className="ve-empty-icon"><Inbox size={40} /></div>
                    <h3>No {activeTab === 'all' ? '' : activeTab} extension requests</h3>
                    <p>Customers haven't submitted any extension requests yet.</p>
                </div>
            ) : (
                <div className="ve-list">
                    {requests.map(req => (
                        <div key={req._id} className={`ve-card ve-card-${req.status}`}>
                            {/* Card top */}
                            <div className="ve-card-top">
                                <div className="ve-prod-icon"><Package size={18} /></div>
                                <div className="ve-card-info">
                                    <div className="ve-prod-name">{req.productName}</div>
                                    <div className="ve-prod-brand">{req.brand}</div>
                                </div>
                                <span className={`ve-status-badge ve-s-${req.status}`}>
                                    {req.status === 'approved' && <CheckCircle size={11} />}
                                    {req.status === 'pending'  && <Clock       size={11} />}
                                    {req.status === 'denied'   && <XCircle     size={11} />}
                                    {req.status}
                                </span>
                            </div>

                            {/* Details grid */}
                            <div className="ve-detail-grid">
                                <div className="ve-detail">
                                    <span className="ve-dlabel"><Package size={11} /> Serial</span>
                                    <span className="ve-dval ve-mono">{req.serialNumber || '—'}</span>
                                </div>
                                <div className="ve-detail">
                                    <span className="ve-dlabel"><User size={11} /> Customer</span>
                                    <span className="ve-dval">{req.userName}</span>
                                </div>
                                <div className="ve-detail">
                                    <span className="ve-dlabel">@ Email</span>
                                    <span className="ve-dval ve-mono">{req.userEmail}</span>
                                </div>
                                <div className="ve-detail">
                                    <span className="ve-dlabel"><Calendar size={11} /> Current Expiry</span>
                                    <span className="ve-dval">{fmtDate(req.currentExpiry)}</span>
                                </div>
                                {req.requestedExpiry && (
                                    <div className="ve-detail">
                                        <span className="ve-dlabel"><Calendar size={11} /> Requested Expiry</span>
                                        <span className="ve-dval ve-text-amber">{fmtDate(req.requestedExpiry)}</span>
                                    </div>
                                )}
                                <div className="ve-detail">
                                    <span className="ve-dlabel"><Clock size={11} /> Requested At</span>
                                    <span className="ve-dval">{fmtDate(req.requestedAt)}</span>
                                </div>
                                {req.reason && (
                                    <div className="ve-detail ve-detail-full">
                                        <span className="ve-dlabel">Reason</span>
                                        <span className="ve-dval" style={{ fontStyle: 'italic' }}>"{req.reason}"</span>
                                    </div>
                                )}
                                {req.newExpiry && req.status === 'approved' && (
                                    <div className="ve-detail ve-detail-full">
                                        <span className="ve-dlabel"><CheckCircle size={11} /> Approved New Expiry</span>
                                        <span className="ve-dval ve-text-teal" style={{ fontWeight: 700 }}>{fmtDate(req.newExpiry)}</span>
                                    </div>
                                )}
                                {req.vendorNote && (
                                    <div className="ve-detail ve-detail-full">
                                        <span className="ve-dlabel">Your Note</span>
                                        <span className="ve-dval" style={{ fontStyle: 'italic', opacity: .7 }}>"{req.vendorNote}"</span>
                                    </div>
                                )}
                            </div>

                            {/* Action area — pending only */}
                            {req.status === 'pending' && (
                                <div className="ve-actions">
                                    <div className="ve-action-inputs">
                                        <div className="ve-input-group">
                                            <label>New expiry date <span style={{ color:'#fb7185' }}>*</span></label>
                                            <input
                                                type="date"
                                                className="ve-input"
                                                value={expiryMap[req._id] ?? req.requestedExpiry?.split('T')[0] ?? ''}
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={e => setExpiryMap(m => ({ ...m, [req._id]: e.target.value }))}
                                            />
                                        </div>
                                        <div className="ve-input-group">
                                            <label>Note to customer <span>(optional)</span></label>
                                            <input
                                                className="ve-input"
                                                placeholder="e.g. Extended as goodwill gesture…"
                                                value={noteMap[req._id] ?? ''}
                                                onChange={e => setNoteMap(m => ({ ...m, [req._id]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="ve-action-btns">
                                        <button
                                            className="ve-btn-approve"
                                            disabled={processing === req._id || !expiryMap[req._id]}
                                            onClick={() => handleApprove(req)}
                                        >
                                            {processing === req._id ? (
                                                <><div className="ve-spin" /> Processing…</>
                                            ) : (
                                                <><CheckCircle size={14} /> Approve &amp; Extend</>
                                            )}
                                        </button>
                                        <button
                                            className="ve-btn-deny"
                                            disabled={processing === req._id}
                                            onClick={() => handleDeny(req)}
                                        >
                                            <XCircle size={14} /> Deny
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
