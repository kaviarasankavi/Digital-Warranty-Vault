import { useState, useEffect, useCallback } from 'react';
import {
    ShieldCheck, Clock, CheckCircle, XCircle,
    RefreshCw, Package, User, Calendar, Inbox,
} from 'lucide-react';
import { verificationApi, VerificationRequest } from '../../api/verificationApi';
import { useAuthStore } from '../../store/authStore';
import './VendorVerify.css';

type Tab = 'pending' | 'verified' | 'rejected' | 'all';

export default function VendorVerify() {
    const { user } = useAuthStore();
    const [requests,    setRequests]    = useState<VerificationRequest[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [activeTab,   setActiveTab]   = useState<Tab>('pending');
    const [processing,  setProcessing]  = useState<string | null>(null);
    const [noteMap,     setNoteMap]     = useState<Record<string, string>>({});
    const [actionMsg,   setActionMsg]   = useState<{ id: string; ok: boolean; text: string } | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const data = await verificationApi.getVendorRequests(activeTab === 'all' ? undefined : activeTab);
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeTab]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 20 s
    useEffect(() => {
        const id = setInterval(() => load(true), 20000);
        return () => clearInterval(id);
    }, [load]);

    const handleVerify = async (req: VerificationRequest) => {
        setProcessing(req._id);
        setActionMsg(null);
        try {
            await verificationApi.verifyRequest(req._id, noteMap[req._id] ?? '');
            setActionMsg({ id: req._id, ok: true, text: `${req.productName} verified successfully!` });
            load(true);
        } catch (e: any) {
            setActionMsg({ id: req._id, ok: false, text: e?.response?.data?.message ?? 'Failed to verify.' });
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (req: VerificationRequest) => {
        setProcessing(req._id);
        setActionMsg(null);
        try {
            await verificationApi.rejectRequest(req._id, noteMap[req._id] ?? '');
            setActionMsg({ id: req._id, ok: false, text: `Request rejected.` });
            load(true);
        } catch (e: any) {
            setActionMsg({ id: req._id, ok: false, text: e?.response?.data?.message ?? 'Failed to reject.' });
        } finally {
            setProcessing(null);
        }
    };

    const tabs: { key: Tab; label: string; color: string }[] = [
        { key: 'pending',  label: 'Pending',  color: 'amber'  },
        { key: 'verified', label: 'Verified', color: 'teal'   },
        { key: 'rejected', label: 'Rejected', color: 'coral'  },
        { key: 'all',      label: 'All',      color: 'slate'  },
    ];

    const brand = user?.email?.split('@')[1]?.split('.')[0] ?? 'Brand';

    return (
        <div className="vv-page">
            {/* Header */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">
                        Verify <span className="vd-title-accent">Requests</span>
                    </h1>
                    <p className="vd-page-sub">
                        Product verification inbox for <strong style={{ color: '#2dd4bf', textTransform: 'capitalize' }}>{brand}</strong>
                    </p>
                </div>
                <button className={`vd-btn-secondary ${refreshing ? 'vv-refreshing' : ''}`} onClick={() => load(true)}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="vv-tabs">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        className={`vv-tab vv-tab-${t.color} ${activeTab === t.key ? 'vv-tab-active' : ''}`}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.key === 'pending'  && <Clock       size={13} />}
                        {t.key === 'verified' && <CheckCircle size={13} />}
                        {t.key === 'rejected' && <XCircle     size={13} />}
                        {t.key === 'all'      && <ShieldCheck size={13} />}
                        {t.label}
                        {requests.length > 0 && activeTab === t.key && (
                            <span className="vv-count">{requests.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Global action message */}
            {actionMsg && (
                <div className={`vv-toast ${actionMsg.ok ? 'vv-toast-ok' : 'vv-toast-err'}`}>
                    {actionMsg.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {actionMsg.text}
                </div>
            )}

            {/* Cards */}
            {loading ? (
                <div className="vv-loading">
                    <div className="vd-loader-ring" /> Loading requests…
                </div>
            ) : requests.length === 0 ? (
                <div className="vv-empty">
                    <div className="vv-empty-icon"><Inbox size={40} /></div>
                    <h3>No {activeTab === 'all' ? '' : activeTab} requests</h3>
                    <p>
                        {activeTab === 'pending'
                            ? 'No users have submitted verification requests yet.'
                            : 'Nothing to show for this filter.'}
                    </p>
                </div>
            ) : (
                <div className="vv-list">
                    {requests.map(req => (
                        <div key={req._id} className={`vv-card vv-card-${req.status}`}>
                            {/* Card top */}
                            <div className="vv-card-top">
                                <div className="vv-product-icon">
                                    <Package size={18} />
                                </div>
                                <div className="vv-card-info">
                                    <div className="vv-product-name">{req.productName}</div>
                                    <div className="vv-product-brand">{req.brand}</div>
                                </div>
                                <div className={`vv-status-badge vv-s-${req.status}`}>
                                    {req.status === 'verified' && <CheckCircle size={11} />}
                                    {req.status === 'pending'  && <Clock       size={11} />}
                                    {req.status === 'rejected' && <XCircle     size={11} />}
                                    {req.status}
                                </div>
                            </div>

                            {/* Details grid */}
                            <div className="vv-detail-grid">
                                <div className="vv-detail">
                                    <span className="vv-detail-label"><Package size={11} /> Serial No.</span>
                                    <span className="vv-detail-val vv-mono">{req.serialNumber || '—'}</span>
                                </div>
                                <div className="vv-detail">
                                    <span className="vv-detail-label"><User size={11} /> Customer</span>
                                    <span className="vv-detail-val">{req.userName}</span>
                                </div>
                                <div className="vv-detail">
                                    <span className="vv-detail-label"><span>@</span> Email</span>
                                    <span className="vv-detail-val vv-mono">{req.userEmail}</span>
                                </div>
                                <div className="vv-detail">
                                    <span className="vv-detail-label"><Calendar size={11} /> Requested</span>
                                    <span className="vv-detail-val">
                                        {new Date(req.requestedAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })}
                                        {' '}
                                        {new Date(req.requestedAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                                    </span>
                                </div>
                                {req.verifiedAt && (
                                    <div className="vv-detail">
                                        <span className="vv-detail-label"><CheckCircle size={11} /> {req.status === 'verified' ? 'Verified' : 'Rejected'} At</span>
                                        <span className="vv-detail-val">
                                            {new Date(req.verifiedAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })}
                                        </span>
                                    </div>
                                )}
                                {req.vendorNote && (
                                    <div className="vv-detail vv-detail-full">
                                        <span className="vv-detail-label">Note</span>
                                        <span className="vv-detail-val" style={{ fontStyle: 'italic' }}>"{req.vendorNote}"</span>
                                    </div>
                                )}
                            </div>

                            {/* Action area — only for pending */}
                            {req.status === 'pending' && (
                                <div className="vv-actions">
                                    <input
                                        className="vv-note-input"
                                        placeholder="Optional note to customer…"
                                        value={noteMap[req._id] ?? ''}
                                        onChange={e => setNoteMap(m => ({ ...m, [req._id]: e.target.value }))}
                                    />
                                    <div className="vv-action-btns">
                                        <button
                                            className="vv-btn-verify"
                                            disabled={processing === req._id}
                                            onClick={() => handleVerify(req)}
                                        >
                                            {processing === req._id ? (
                                                <><div className="vv-spin" /> Processing…</>
                                            ) : (
                                                <><CheckCircle size={14} /> Verify Product</>
                                            )}
                                        </button>
                                        <button
                                            className="vv-btn-reject"
                                            disabled={processing === req._id}
                                            onClick={() => handleReject(req)}
                                        >
                                            <XCircle size={14} /> Reject
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
