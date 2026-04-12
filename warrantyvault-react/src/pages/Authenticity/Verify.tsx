import { useState, useEffect, useCallback } from 'react';
import { productApi, Product } from '../../api/productApi';
import { verificationApi, VerificationRequest } from '../../api/verificationApi';
import {
    Shield, Search, CheckCircle, XCircle, AlertCircle,
    Clock, ChevronRight, Scan, Send, RefreshCw,
} from 'lucide-react';
import './Verify.css';

export default function Verify() {
    const [products,          setProducts]          = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [isSubmitting,      setIsSubmitting]      = useState(false);
    const [submitMsg,         setSubmitMsg]         = useState<{ text: string; ok: boolean } | null>(null);
    const [myRequests,        setMyRequests]        = useState<VerificationRequest[]>([]);
    const [loadingRequests,   setLoadingRequests]   = useState(true);
    const [refreshing,        setRefreshing]        = useState(false);

    // ── Load products ────────────────────────────────────────────────────────
    useEffect(() => {
        productApi.getAll().then(res => {
            setProducts(res.data);
            if (res.data.length > 0) setSelectedProductId(String(res.data[0].id));
        }).catch(err => console.error('Failed to load products:', err));
    }, []);

    // ── Load / refresh verification requests ────────────────────────────────
    const loadRequests = useCallback(async (silent = false) => {
        if (!silent) setLoadingRequests(true);
        else setRefreshing(true);
        try {
            const data = await verificationApi.getMyRequests();
            setMyRequests(data);
        } catch (e) {
            console.error('Failed to load verification requests:', e);
        } finally {
            setLoadingRequests(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadRequests(); }, [loadRequests]);

    // Auto-refresh every 15 s so status updates appear without manual reload
    useEffect(() => {
        const id = setInterval(() => loadRequests(true), 15000);
        return () => clearInterval(id);
    }, [loadRequests]);

    // ── Submit verification request ──────────────────────────────────────────
    const handleRequest = async () => {
        if (!selectedProductId) return;
        const product = products.find(p => String(p.id) === selectedProductId);
        if (!product) return;

        if (!product.brand) {
            setSubmitMsg({ text: 'This product has no brand set. Please edit the product and add a brand first.', ok: false });
            return;
        }

        setIsSubmitting(true);
        setSubmitMsg(null);
        try {
            const res = await verificationApi.requestVerification({
                productId:    product.id,
                productName:  product.name,
                brand:        product.brand,
                serialNumber: product.serialNumber ?? '',
            });
            setSubmitMsg({ text: res.message, ok: true });
            loadRequests(true);
        } catch (err: any) {
            setSubmitMsg({
                text: err?.response?.data?.message ?? 'Failed to send verification request.',
                ok: false,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const statusOf = (productId: number) =>
        myRequests.find(r => r.productId === productId)?.status ?? null;

    const stats = {
        total:    myRequests.length,
        verified: myRequests.filter(r => r.status === 'verified').length,
        pending:  myRequests.filter(r => r.status === 'pending').length,
        rejected: myRequests.filter(r => r.status === 'rejected').length,
    };

    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'verified') return (
            <span className="vbadge vbadge-verified"><CheckCircle size={11} /> Verified</span>
        );
        if (status === 'rejected') return (
            <span className="vbadge vbadge-rejected"><XCircle size={11} /> Rejected</span>
        );
        return <span className="vbadge vbadge-pending"><Clock size={11} /> Pending</span>;
    };

    const selectedProduct = products.find(p => String(p.id) === selectedProductId);
    const selectedStatus  = selectedProduct ? statusOf(selectedProduct.id) : null;

    return (
        <div className="verify-page">
            <div className="verify-content">

                {/* ── Top Grid ── */}
                <div className="verify-top-grid">

                    {/* Verification Portal Card */}
                    <div className="verify-portal-card">
                        <div className="portal-header">
                            <Shield size={22} className="portal-shield-icon" />
                            <div>
                                <h2 className="portal-title">Authenticity Portal</h2>
                                <p className="portal-subtitle">
                                    Select a product to send a verification request to the brand vendor
                                </p>
                            </div>
                        </div>

                        {/* Product selector */}
                        <div className="portal-input-row">
                            <div className="portal-input-wrap">
                                <Search size={16} className="portal-search-icon" />
                                <select
                                    className="portal-serial-input"
                                    value={selectedProductId}
                                    onChange={e => { setSelectedProductId(e.target.value); setSubmitMsg(null); }}
                                    style={{ appearance: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                                >
                                    {products.length === 0 && <option value="">No products in vault</option>}
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}{p.brand ? ` (${p.brand})` : ''} — {p.serialNumber || `ID: ${p.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className={`portal-verify-btn ${isSubmitting ? 'portal-verify-loading' : ''}`}
                                onClick={handleRequest}
                                disabled={isSubmitting || !selectedProductId || selectedStatus === 'pending' || selectedStatus === 'verified'}
                            >
                                {isSubmitting ? (
                                    <><div className="verify-spinner" /> Sending…</>
                                ) : selectedStatus === 'verified' ? (
                                    <><CheckCircle size={15} /> Verified</>
                                ) : selectedStatus === 'pending' ? (
                                    <><Clock size={15} /> Awaiting…</>
                                ) : (
                                    <><Send size={15} /> Request Verify</>
                                )}
                            </button>
                        </div>

                        {/* Status of selected product */}
                        {selectedProduct && selectedStatus && (
                            <div className={`verify-status-bar status-bar-${selectedStatus}`}>
                                {selectedStatus === 'verified' && <><CheckCircle size={15} /> <strong>{selectedProduct.name}</strong> has been verified by <strong>{selectedProduct.brand}</strong></>}
                                {selectedStatus === 'pending'  && <><Clock size={15} /> Verification request sent to <strong>{selectedProduct.brand}</strong> — awaiting response</>}
                                {selectedStatus === 'rejected' && <><XCircle size={15} /> Verification was rejected by <strong>{selectedProduct.brand}</strong>. You may re-submit.</>}
                            </div>
                        )}

                        {/* Submission feedback */}
                        {submitMsg && (
                            <div className={`portal-feedback ${submitMsg.ok ? 'feedback-ok' : 'feedback-err'}`}>
                                {submitMsg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                {submitMsg.text}
                            </div>
                        )}

                        {/* How it works */}
                        <div className="portal-how-it-works">
                            <h4>How it works</h4>
                            <div className="how-steps">
                                <div className="how-step"><div className="step-num">1</div><span>Select a product from your vault</span></div>
                                <div className="how-step"><div className="step-num">2</div><span>Click "Request Verify" — sent to the brand's vendor</span></div>
                                <div className="how-step"><div className="step-num">3</div><span>Vendor reviews and clicks "Verified"</span></div>
                                <div className="how-step"><div className="step-num">4</div><span>Status updates here automatically</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Stats sidebar */}
                    <div className="verify-stats-column">
                        <div className="verify-stat-card vstat-total">
                            <div className="vstat-icon"><Shield size={18} /></div>
                            <div className="vstat-number">{stats.total}</div>
                            <div className="vstat-label">Total Requests</div>
                        </div>
                        <div className="verify-stat-card vstat-authentic">
                            <div className="vstat-icon green"><CheckCircle size={18} /></div>
                            <div className="vstat-number">{stats.verified}</div>
                            <div className="vstat-label">Verified</div>
                        </div>
                        <div className="verify-stat-card vstat-pending">
                            <div className="vstat-icon amber"><Clock size={18} /></div>
                            <div className="vstat-number">{stats.pending}</div>
                            <div className="vstat-label">Pending</div>
                        </div>
                        <div className="verify-stat-card vstat-flagged">
                            <div className="vstat-icon red"><XCircle size={18} /></div>
                            <div className="vstat-number">{stats.rejected}</div>
                            <div className="vstat-label">Rejected</div>
                        </div>
                    </div>
                </div>

                {/* ── Products with Verification Status ── */}
                {products.length > 0 && (
                    <div className="verify-products-section">
                        <div className="section-header-row">
                            <h3 className="section-title">Your Products</h3>
                            <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={() => loadRequests(true)} title="Refresh">
                                <RefreshCw size={14} />
                            </button>
                        </div>
                        <div className="verify-products-grid">
                            {products.map(p => {
                                const st = statusOf(p.id);
                                return (
                                    <div key={p.id} className={`vproduct-card ${st ? `vp-${st}` : ''}`}
                                        onClick={() => setSelectedProductId(String(p.id))}>
                                        <div className="vproduct-top">
                                            <div className="vproduct-name">{p.name}</div>
                                            {st ? <StatusBadge status={st} /> : (
                                                <span className="vbadge vbadge-none"><Scan size={10} /> Unverified</span>
                                            )}
                                        </div>
                                        <div className="vproduct-meta">
                                            <span>{p.brand || '—'}</span>
                                            {p.serialNumber && <span>· {p.serialNumber}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Request History ── */}
                <div className="check-history-section">
                    <div className="history-header">
                        <div className="history-title-row">
                            <Clock size={18} />
                            <h3 className="history-title">Verification Requests</h3>
                        </div>
                    </div>
                    <div className="history-list">
                        {loadingRequests ? (
                            <div className="verify-loading-row"><div className="verify-spinner" /> Loading…</div>
                        ) : myRequests.length === 0 ? (
                            <div className="verify-empty-row">No verification requests yet. Select a product above to get started.</div>
                        ) : (
                            myRequests.map(req => (
                                <div key={req._id} className={`history-entry history-${req.status}`}>
                                    <div className={`history-result-dot dot-${req.status}`}>
                                        {req.status === 'verified' ? <CheckCircle size={14} /> :
                                         req.status === 'rejected' ? <XCircle size={14} /> :
                                         <Clock size={14} />}
                                    </div>
                                    <div className="history-info">
                                        <div className="history-product-row">
                                            <span className="history-product">{req.productName}</span>
                                            <span className="history-vendor">· {req.brand}</span>
                                        </div>
                                        <div className="history-meta-row">
                                            <span className="history-check-id">{req.serialNumber || `ID: ${req.productId}`}</span>
                                            {req.vendorNote && <span className="history-note">"{req.vendorNote}"</span>}
                                        </div>
                                    </div>
                                    <div className="history-right">
                                        <StatusBadge status={req.status} />
                                        <div className="history-time">
                                            {new Date(req.requestedAt).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })}
                                        </div>
                                        {req.verifiedAt && (
                                            <div className="history-time" style={{ opacity: 0.6 }}>
                                                {req.status === 'verified' ? '✓' : '✗'} {new Date(req.verifiedAt).toLocaleDateString('en-US', { day:'2-digit', month:'short' })}
                                            </div>
                                        )}
                                        <button className="history-view-btn"><ChevronRight size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
