import { useState, useEffect, useCallback } from 'react';
import { productApi, Product } from '../../api/productApi';
import { warrantyExtensionApi, ExtensionRequest } from '../../api/warrantyExtensionApi';
import {
    Shield, Clock, CheckCircle, XCircle, Calendar,
    ChevronDown, ChevronUp, RefreshCw, Send, AlertTriangle, Info,
} from 'lucide-react';
import './WarrantyExtension.css';

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysLeft = (d: string | null | undefined) =>
    d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null;

const warrantyLabel = (d: string | null | undefined) => {
    const days = daysLeft(d);
    if (days === null) return { text: 'No warranty', cls: 'we-badge-none' };
    if (days < 0)      return { text: 'Expired',     cls: 'we-badge-exp'  };
    if (days <= 30)    return { text: `${days}d left`, cls: 'we-badge-warn' };
    return { text: 'Active', cls: 'we-badge-ok' };
};

export default function WarrantyExtension() {
    const [products,    setProducts]    = useState<Product[]>([]);
    const [myRequests,  setMyRequests]  = useState<ExtensionRequest[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);

    // Per-product form state
    const [expanded,         setExpanded]         = useState<number | null>(null);
    const [reasonMap,        setReasonMap]        = useState<Record<number, string>>({});
    const [reqExpiryMap,     setReqExpiryMap]     = useState<Record<number, string>>({});
    const [submitting,       setSubmitting]        = useState<number | null>(null);
    const [feedbackMap,      setFeedbackMap]       = useState<Record<number, { ok: boolean; text: string }>>({});

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [prodRes, reqRes] = await Promise.all([
                productApi.getAll({ limit: 100 }),
                warrantyExtensionApi.getMyRequests(),
            ]);
            setProducts(prodRes.data);
            setMyRequests(reqRes);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-refresh every 20 s
    useEffect(() => {
        const id = setInterval(() => loadData(true), 20000);
        return () => clearInterval(id);
    }, [loadData]);

    const requestOf = (productId: number) =>
        myRequests.find(r => r.productId === productId) ?? null;

    const handleRequest = async (product: Product) => {
        setSubmitting(product.id);
        setFeedbackMap(m => ({ ...m, [product.id]: undefined as any }));
        try {
            const res = await warrantyExtensionApi.requestExtension({
                productId:       product.id,
                productName:     product.name,
                brand:           product.brand,
                serialNumber:    product.serialNumber ?? '',
                currentExpiry:   product.warrantyExpiry ?? null,
                requestedExpiry: reqExpiryMap[product.id] ?? null,
                reason:          reasonMap[product.id]   ?? '',
            });
            setFeedbackMap(m => ({ ...m, [product.id]: { ok: true, text: res.message } }));
            setExpanded(null);
            loadData(true);
        } catch (err: any) {
            setFeedbackMap(m => ({
                ...m,
                [product.id]: { ok: false, text: err?.response?.data?.message ?? 'Request failed.' },
            }));
        } finally {
            setSubmitting(null);
        }
    };

    const stats = {
        total:    myRequests.length,
        pending:  myRequests.filter(r => r.status === 'pending').length,
        approved: myRequests.filter(r => r.status === 'approved').length,
        denied:   myRequests.filter(r => r.status === 'denied').length,
    };

    return (
        <div className="we-page">

            {/* Header */}
            <div className="we-header">
                <div>
                    <h2 className="we-title">Warranty Extensions</h2>
                    <p className="we-sub">Request vendors to extend warranty coverage on your products</p>
                </div>
                <button
                    className={`we-refresh-btn ${refreshing ? 'we-spinning' : ''}`}
                    onClick={() => loadData(true)}
                >
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Stats row */}
            <div className="we-stats-row">
                {[
                    { label: 'Requests',  val: stats.total,    icon: Shield,       cls: 'stat-blue'   },
                    { label: 'Pending',   val: stats.pending,  icon: Clock,        cls: 'stat-amber'  },
                    { label: 'Approved',  val: stats.approved, icon: CheckCircle,  cls: 'stat-green'  },
                    { label: 'Denied',    val: stats.denied,   icon: XCircle,      cls: 'stat-red'    },
                ].map(({ label, val, icon: Icon, cls }) => (
                    <div key={label} className={`we-stat-card ${cls}`}>
                        <div className="we-stat-icon"><Icon size={16} /></div>
                        <div className="we-stat-val">{val}</div>
                        <div className="we-stat-label">{label}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="we-loading"><div className="we-spinner" /> Loading products…</div>
            ) : (
                <>
                    {/* Product cards */}
                    <div className="we-section-title">
                        <Shield size={15} /> Your Products
                    </div>

                    {products.length === 0 ? (
                        <div className="we-empty">
                            <Info size={28} />
                            <p>No products in your vault. Add products first.</p>
                        </div>
                    ) : (
                        <div className="we-product-list">
                            {products.map(p => {
                                const req = requestOf(p.id);
                                const wl  = warrantyLabel(p.warrantyExpiry);
                                const isExp = expanded === p.id;
                                const fb    = feedbackMap[p.id];
                                const days  = daysLeft(p.warrantyExpiry);
                                const canRequest = !req || req.status === 'denied';
                                const isExpiring = days !== null && days <= 60;

                                return (
                                    <div key={p.id} className={`we-product-card ${req?.status ? `we-card-${req.status}` : ''} ${isExpiring && !req ? 'we-card-highlight' : ''}`}>
                                        {/* Card header */}
                                        <div className="we-card-top">
                                            <div className="we-card-left">
                                                <div className="we-product-name">{p.name}</div>
                                                <div className="we-product-meta">
                                                    <span>{p.brand}</span>
                                                    {p.serialNumber && <span>· {p.serialNumber}</span>}
                                                </div>
                                            </div>
                                            <div className="we-card-right">
                                                {/* Warranty expiry info */}
                                                <div className="we-expiry-group">
                                                    {req?.status === 'approved' && req.newExpiry ? (
                                                        <div className="we-expiry-updated">
                                                            <CheckCircle size={12} />
                                                            <span>Extended to <strong>{fmtDate(req.newExpiry)}</strong></span>
                                                        </div>
                                                    ) : (
                                                        <div className="we-expiry-row">
                                                            <Calendar size={12} />
                                                            <span>{fmtDate(p.warrantyExpiry)}</span>
                                                        </div>
                                                    )}
                                                    <span className={`we-warranty-badge ${wl.cls}`}>{wl.text}</span>
                                                </div>

                                                {/* Status badge if request exists */}
                                                {req && (
                                                    <span className={`we-status-badge ws-${req.status}`}>
                                                        {req.status === 'pending'  && <Clock size={10} />}
                                                        {req.status === 'approved' && <CheckCircle size={10} />}
                                                        {req.status === 'denied'   && <XCircle size={10} />}
                                                        {req.status}
                                                    </span>
                                                )}

                                                {/* Expand / Request button */}
                                                {canRequest && (
                                                    <button
                                                        className="we-expand-btn"
                                                        onClick={() => setExpanded(isExp ? null : p.id)}
                                                    >
                                                        {isExp ? <><ChevronUp size={13} /> Cancel</> : <><Send size={13} /> Request Extension</>}
                                                    </button>
                                                )}

                                                {req?.status === 'pending' && (
                                                    <div className="we-pending-notice">
                                                        <Clock size={11} /> Awaiting vendor review
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Approved note */}
                                        {req?.status === 'approved' && req.vendorNote && (
                                            <div className="we-vendor-note we-note-ok">
                                                <CheckCircle size={12} /> Vendor note: "{req.vendorNote}"
                                            </div>
                                        )}
                                        {req?.status === 'denied' && (
                                            <div className="we-vendor-note we-note-bad">
                                                <XCircle size={12} /> {req.vendorNote ? `Denied: "${req.vendorNote}"` : 'Request was denied. You may re-submit.'}
                                            </div>
                                        )}

                                        {/* Expandable request form */}
                                        {isExp && (
                                            <div className="we-form">
                                                <div className="we-form-row">
                                                    <label>Suggested new expiry date <span>(optional)</span></label>
                                                    <input
                                                        type="date"
                                                        className="we-input"
                                                        value={reqExpiryMap[p.id] ?? ''}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={e => setReqExpiryMap(m => ({ ...m, [p.id]: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="we-form-row">
                                                    <label>Reason for extension request</label>
                                                    <textarea
                                                        className="we-textarea"
                                                        placeholder="e.g. Product has a manufacturing defect, warranty expired early…"
                                                        value={reasonMap[p.id] ?? ''}
                                                        onChange={e => setReasonMap(m => ({ ...m, [p.id]: e.target.value }))}
                                                        rows={3}
                                                    />
                                                </div>

                                                {!p.brand && (
                                                    <div className="we-form-warning">
                                                        <AlertTriangle size={13} />
                                                        This product has no brand set. Please edit it and add a brand first.
                                                    </div>
                                                )}

                                                {fb && (
                                                    <div className={`we-feedback ${fb.ok ? 'fb-ok' : 'fb-err'}`}>
                                                        {fb.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                                                        {fb.text}
                                                    </div>
                                                )}

                                                <button
                                                    className="we-submit-btn"
                                                    disabled={submitting === p.id || !p.brand}
                                                    onClick={() => handleRequest(p)}
                                                >
                                                    {submitting === p.id ? (
                                                        <><div className="we-spin" /> Sending…</>
                                                    ) : (
                                                        <><Send size={14} /> Send Extension Request to {p.brand || 'Vendor'}</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Request history */}
                    {myRequests.length > 0 && (
                        <>
                            <div className="we-section-title" style={{ marginTop: '1.5rem' }}>
                                <Clock size={15} /> Request History
                            </div>
                            <div className="we-history-list">
                                {myRequests.map(req => (
                                    <div key={req._id} className={`we-history-row we-hist-${req.status}`}>
                                        <div className={`we-hist-dot hd-${req.status}`}>
                                            {req.status === 'approved' && <CheckCircle size={13} />}
                                            {req.status === 'pending'  && <Clock       size={13} />}
                                            {req.status === 'denied'   && <XCircle     size={13} />}
                                        </div>
                                        <div className="we-hist-info">
                                            <div className="we-hist-name">
                                                {req.productName}
                                                <span className="we-hist-brand">· {req.brand}</span>
                                            </div>
                                            <div className="we-hist-meta">
                                                Current: {fmtDate(req.currentExpiry)}
                                                {req.requestedExpiry && <> · Requested: {fmtDate(req.requestedExpiry)}</>}
                                                {req.newExpiry && req.status === 'approved' && (
                                                    <strong className="we-new-expiry"> → Extended to {fmtDate(req.newExpiry)}</strong>
                                                )}
                                            </div>
                                        </div>
                                        <div className="we-hist-right">
                                            <span className={`we-status-badge ws-${req.status}`}>
                                                {req.status}
                                            </span>
                                            <div className="we-hist-date">{fmtDate(req.requestedAt)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
