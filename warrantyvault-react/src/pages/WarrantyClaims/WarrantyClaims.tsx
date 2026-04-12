import { useState, useEffect, useCallback } from 'react';
import {
    Wrench, MapPin, Calendar, Clock, CheckCircle, XCircle,
    AlertTriangle, ChevronDown, ChevronUp, Send, RefreshCw,
    Phone, FileText, Package, User, Info,
} from 'lucide-react';
import { productApi, Product } from '../../api/productApi';
import { warrantyClaimApi, WarrantyClaim, ClaimLocation, ClaimStatus } from '../../api/warrantyClaimApi';
import './WarrantyClaims.css';

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_STEPS: ClaimStatus[] = ['submitted', 'reviewed', 'scheduled', 'completed'];

const DEFECT_TYPES = [
    'Hardware Failure', 'Screen Damage', 'Battery Issue', 'Software Bug',
    'Physical Damage', 'Water Damage', 'Connectivity Issue', 'Other',
];

interface ClaimForm {
    defectType: string; defectDescription: string; userPhone: string;
    address: string; city: string; state: string; pincode: string; landmark: string;
}

const EMPTY_FORM: ClaimForm = {
    defectType: '', defectDescription: '', userPhone: '',
    address: '', city: '', state: '', pincode: '', landmark: '',
};

export default function WarrantyClaims() {
    const [products,   setProducts]   = useState<Product[]>([]);
    const [claims,     setClaims]     = useState<WarrantyClaim[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [expanded,   setExpanded]   = useState<number | null>(null);
    const [formMap,    setFormMap]    = useState<Record<number, ClaimForm>>({});
    const [submitting, setSubmitting] = useState<number | null>(null);
    const [feedback,   setFeedback]   = useState<Record<number, { ok: boolean; text: string }>>({});

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const [pRes, cRes] = await Promise.all([
                productApi.getAll({ limit: 100 }),
                warrantyClaimApi.getMyClaims(),
            ]);
            setProducts(pRes.data);
            setClaims(cRes);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { const id = setInterval(() => loadData(true), 20000); return () => clearInterval(id); }, [loadData]);

    const claimOf = (pid: number) => claims.find(c => c.productId === pid) ?? null;

    const setField = (pid: number, key: keyof ClaimForm, val: string) =>
        setFormMap(m => ({ ...m, [pid]: { ...(m[pid] ?? EMPTY_FORM), [key]: val } }));

    const handleSubmit = async (p: Product) => {
        const f = formMap[p.id] ?? EMPTY_FORM;
        if (!f.defectDescription.trim()) {
            setFeedback(m => ({ ...m, [p.id]: { ok: false, text: 'Please describe the defect.' } }));
            return;
        }
        if (!f.address || !f.city || !f.state || !f.pincode) {
            setFeedback(m => ({ ...m, [p.id]: { ok: false, text: 'Please fill all address fields.' } }));
            return;
        }
        setSubmitting(p.id);
        setFeedback(m => ({ ...m, [p.id]: undefined as any }));
        try {
            const res = await warrantyClaimApi.submit({
                productId: p.id, productName: p.name, brand: p.brand,
                serialNumber: p.serialNumber ?? '',
                defectType: f.defectType, defectDescription: f.defectDescription,
                userPhone: f.userPhone,
                location: { address: f.address, city: f.city, state: f.state, pincode: f.pincode, landmark: f.landmark },
            });
            setFeedback(m => ({ ...m, [p.id]: { ok: true, text: res.message } }));
            setExpanded(null);
            setFormMap(m => ({ ...m, [p.id]: EMPTY_FORM }));
            loadData(true);
        } catch (err: any) {
            setFeedback(m => ({ ...m, [p.id]: { ok: false, text: err?.response?.data?.message ?? 'Submission failed.' } }));
        } finally { setSubmitting(null); }
    };

    const stats = {
        total: claims.length,
        active: claims.filter(c => ['submitted','reviewed','scheduled'].includes(c.status)).length,
        scheduled: claims.filter(c => c.status === 'scheduled').length,
        completed: claims.filter(c => c.status === 'completed').length,
    };

    return (
        <div className="wc-page">
            <div className="wc-header">
                <div>
                    <h2 className="wc-title">Warranty Claims</h2>
                    <p className="wc-sub">File a repair request — vendor will schedule a service visit at your location</p>
                </div>
                <button className={`wc-refresh ${refreshing ? 'wc-spinning' : ''}`} onClick={() => loadData(true)}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* Stats */}
            <div className="wc-stats">
                {[
                    { label: 'Total Claims', val: stats.total,     icon: FileText,     cls: 'ws-blue'  },
                    { label: 'Active',       val: stats.active,    icon: Clock,        cls: 'ws-amber' },
                    { label: 'Scheduled',    val: stats.scheduled, icon: Calendar,     cls: 'ws-purple'},
                    { label: 'Completed',    val: stats.completed, icon: CheckCircle,  cls: 'ws-green' },
                ].map(({ label, val, icon: Icon, cls }) => (
                    <div key={label} className={`wc-stat-card ${cls}`}>
                        <div className="wc-stat-icon"><Icon size={16} /></div>
                        <div className="wc-stat-val">{val}</div>
                        <div className="wc-stat-lbl">{label}</div>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="wc-loading"><div className="wc-spinner" />Loading…</div>
            ) : (
                <>
                    <div className="wc-section-hd"><Wrench size={15} />Your Products</div>

                    {products.length === 0 ? (
                        <div className="wc-empty"><Info size={28} /><p>No products in vault.</p></div>
                    ) : (
                        <div className="wc-product-list">
                            {products.map(p => {
                                const claim = claimOf(p.id);
                                const isExp = expanded === p.id;
                                const f     = formMap[p.id] ?? EMPTY_FORM;
                                const fb    = feedback[p.id];
                                const canFile = !claim || claim.status === 'rejected';

                                return (
                                    <div key={p.id} className={`wc-product-card ${claim ? `wc-card-${claim.status}` : ''}`}>

                                        {/* Card header */}
                                        <div className="wc-card-top">
                                            <div className="wc-product-icon"><Package size={18} /></div>
                                            <div className="wc-card-info">
                                                <div className="wc-product-name">{p.name}</div>
                                                <div className="wc-product-meta">
                                                    {p.brand && <span>{p.brand}</span>}
                                                    {p.serialNumber && <span>· {p.serialNumber}</span>}
                                                    {p.warrantyExpiry && <span>· Warranty: {fmtDate(p.warrantyExpiry)}</span>}
                                                </div>
                                            </div>
                                            <div className="wc-card-actions">
                                                {claim && <StatusBadge status={claim.status} />}
                                                {canFile && (
                                                    <button className="wc-file-btn" onClick={() => setExpanded(isExp ? null : p.id)}>
                                                        {isExp ? <><ChevronUp size={13} />Cancel</> : <><Wrench size={13} />File Claim</>}
                                                    </button>
                                                )}
                                                {claim?.status === 'submitted' && (
                                                    <span className="wc-awaiting"><Clock size={11} />Awaiting review</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Active claim info panel */}
                                        {claim && claim.status !== 'rejected' && (
                                            <ClaimInfoPanel claim={claim} />
                                        )}

                                        {/* Rejection note */}
                                        {claim?.status === 'rejected' && (
                                            <div className="wc-note wc-note-bad">
                                                <XCircle size={13} />
                                                Claim rejected{claim.rejectionReason ? `: "${claim.rejectionReason}"` : '.'}
                                                {' '}You may re-file a new claim.
                                            </div>
                                        )}

                                        {/* Claim form */}
                                        {isExp && (
                                            <div className="wc-form">
                                                <div className="wc-form-title"><Wrench size={14} />Claim Details</div>

                                                <div className="wc-form-grid">
                                                    <div className="wc-field">
                                                        <label>Defect Type</label>
                                                        <select className="wc-select" value={f.defectType}
                                                            onChange={e => setField(p.id, 'defectType', e.target.value)}>
                                                            <option value="">Select type…</option>
                                                            {DEFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="wc-field">
                                                        <label><Phone size={11} />Your Phone Number</label>
                                                        <input className="wc-input" placeholder="+91 XXXXX XXXXX"
                                                            value={f.userPhone} onChange={e => setField(p.id, 'userPhone', e.target.value)} />
                                                    </div>
                                                </div>

                                                <div className="wc-field wc-field-full">
                                                    <label>Defect Description <span className="wc-req">*</span></label>
                                                    <textarea className="wc-textarea" rows={3}
                                                        placeholder="Describe the issue in detail (e.g. Screen flickering on startup, battery drains in 2 hours…)"
                                                        value={f.defectDescription}
                                                        onChange={e => setField(p.id, 'defectDescription', e.target.value)} />
                                                </div>

                                                <div className="wc-form-title" style={{ marginTop: '.25rem' }}>
                                                    <MapPin size={14} />Service Location (Offline Repair Store / Home Address)
                                                </div>

                                                <div className="wc-field wc-field-full">
                                                    <label>Street Address <span className="wc-req">*</span></label>
                                                    <input className="wc-input" placeholder="Building/ Street / Area"
                                                        value={f.address} onChange={e => setField(p.id, 'address', e.target.value)} />
                                                </div>

                                                <div className="wc-form-grid">
                                                    <div className="wc-field">
                                                        <label>City <span className="wc-req">*</span></label>
                                                        <input className="wc-input" placeholder="e.g. Chennai"
                                                            value={f.city} onChange={e => setField(p.id, 'city', e.target.value)} />
                                                    </div>
                                                    <div className="wc-field">
                                                        <label>State <span className="wc-req">*</span></label>
                                                        <input className="wc-input" placeholder="e.g. Tamil Nadu"
                                                            value={f.state} onChange={e => setField(p.id, 'state', e.target.value)} />
                                                    </div>
                                                    <div className="wc-field">
                                                        <label>Pincode <span className="wc-req">*</span></label>
                                                        <input className="wc-input" placeholder="600001" maxLength={6}
                                                            value={f.pincode} onChange={e => setField(p.id, 'pincode', e.target.value)} />
                                                    </div>
                                                    <div className="wc-field">
                                                        <label>Landmark <span className="wc-opt">(optional)</span></label>
                                                        <input className="wc-input" placeholder="Near bus stand, opposite mall…"
                                                            value={f.landmark} onChange={e => setField(p.id, 'landmark', e.target.value)} />
                                                    </div>
                                                </div>

                                                {!p.brand && (
                                                    <div className="wc-warn"><AlertTriangle size={13} />Product has no brand — add one before filing a claim.</div>
                                                )}

                                                {fb && (
                                                    <div className={`wc-feedback ${fb.ok ? 'fb-ok' : 'fb-err'}`}>
                                                        {fb.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}{fb.text}
                                                    </div>
                                                )}

                                                <div className="wc-submit-row">
                                                    <button className="wc-submit-btn"
                                                        disabled={submitting === p.id || !p.brand}
                                                        onClick={() => handleSubmit(p)}>
                                                        {submitting === p.id ? (
                                                            <><div className="wc-spin" />Submitting…</>
                                                        ) : (
                                                            <><Send size={14} />Submit Claim to {p.brand || 'Vendor'}</>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Claims History */}
                    {claims.length > 0 && (
                        <>
                            <div className="wc-section-hd" style={{ marginTop: '1.5rem' }}>
                                <FileText size={15} />Claim History
                            </div>
                            <div className="wc-history">
                                {claims.map(c => (
                                    <div key={c._id} className={`wc-hist-row wc-hr-${c.status}`}>
                                        <div className={`wc-hist-dot hd-${c.status}`}>
                                            {c.status === 'completed' ? <CheckCircle size={13} /> :
                                             c.status === 'rejected'  ? <XCircle     size={13} /> :
                                             c.status === 'scheduled' ? <Calendar    size={13} /> :
                                                                        <Clock       size={13} />}
                                        </div>
                                        <div className="wc-hist-info">
                                            <div className="wc-hist-name">{c.productName}
                                                <span className="wc-hist-brand">· {c.brand}</span>
                                                <span className="wc-claim-num">{c.claimNumber}</span>
                                            </div>
                                            <div className="wc-hist-meta">{c.defectType || c.defectDescription.slice(0, 50)}</div>
                                            {c.status === 'scheduled' && c.scheduledDate && (
                                                <div className="wc-hist-appt">
                                                    <Calendar size={10} />{c.scheduledDate} at {c.scheduledTime}
                                                </div>
                                            )}
                                        </div>
                                        <div className="wc-hist-right">
                                            <StatusBadge status={c.status} />
                                            <div className="wc-hist-date">{fmtDate(c.submittedAt)}</div>
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

/* ── Sub-components ── */

function StatusBadge({ status }: { status: ClaimStatus }) {
    const MAP = {
        submitted: { cls: 'sb-submitted', icon: Clock,        label: 'Submitted'  },
        reviewed:  { cls: 'sb-reviewed',  icon: User,         label: 'Reviewed'   },
        scheduled: { cls: 'sb-scheduled', icon: Calendar,     label: 'Scheduled'  },
        completed: { cls: 'sb-completed', icon: CheckCircle,  label: 'Completed'  },
        rejected:  { cls: 'sb-rejected',  icon: XCircle,      label: 'Rejected'   },
    } as const;
    const { cls, icon: Icon, label } = MAP[status];
    return (
        <span className={`wc-badge ${cls}`}>
            <Icon size={10} /> {label}
        </span>
    );
}

function ClaimInfoPanel({ claim }: { claim: WarrantyClaim }) {
    const steps: ClaimStatus[] = ['submitted', 'reviewed', 'scheduled', 'completed'];
    const stepIdx = steps.indexOf(claim.status);

    return (
        <div className="wc-info-panel">
            {/* Status timeline */}
            <div className="wc-timeline">
                {steps.map((s, i) => (
                    <div key={s} className={`wc-step ${i <= stepIdx ? 'wc-step-done' : ''} ${i === stepIdx ? 'wc-step-active' : ''}`}>
                        <div className="wc-step-dot">
                            {i < stepIdx ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
                        </div>
                        <div className="wc-step-label">{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                        {i < steps.length - 1 && <div className={`wc-step-line ${i < stepIdx ? 'wc-line-done' : ''}`} />}
                    </div>
                ))}
            </div>

            {/* Claim details grid */}
            <div className="wc-info-grid">
                <div className="wc-info-item">
                    <span className="wc-info-label"><FileText size={11} />Claim #</span>
                    <span className="wc-info-val wc-mono">{claim.claimNumber}</span>
                </div>
                <div className="wc-info-item">
                    <span className="wc-info-label"><Wrench size={11} />Defect</span>
                    <span className="wc-info-val">{claim.defectType || '—'}</span>
                </div>
                <div className="wc-info-item wc-info-full">
                    <span className="wc-info-label"><MapPin size={11} />Service Location</span>
                    <span className="wc-info-val">
                        {claim.location.address}, {claim.location.city}, {claim.location.state} — {claim.location.pincode}
                        {claim.location.landmark && ` (Near: ${claim.location.landmark})`}
                    </span>
                </div>
                <div className="wc-info-item wc-info-full">
                    <span className="wc-info-label"><AlertTriangle size={11} />Issue Description</span>
                    <span className="wc-info-val">{claim.defectDescription}</span>
                </div>
            </div>

            {/* Scheduled appointment card */}
            {claim.status === 'scheduled' && claim.scheduledDate && (
                <div className="wc-appointment-card">
                    <div className="wc-appt-icon"><Calendar size={22} /></div>
                    <div className="wc-appt-info">
                        <div className="wc-appt-title">Service Visit Scheduled</div>
                        <div className="wc-appt-datetime">
                            {claim.scheduledDate} &nbsp;·&nbsp; {claim.scheduledTime}
                        </div>
                        <div className="wc-appt-loc">
                            <MapPin size={12} />
                            {claim.location.address}, {claim.location.city}
                        </div>
                    </div>
                </div>
            )}

            {/* Vendor message */}
            {claim.vendorMessage && (
                <div className="wc-vendor-msg">
                    <span className="wc-vmsg-label">Message from {claim.brand} team</span>
                    <p className="wc-vmsg-text">"{claim.vendorMessage}"</p>
                </div>
            )}

            {/* Completed */}
            {claim.status === 'completed' && (
                <div className="wc-completed-banner">
                    <CheckCircle size={16} />
                    Repair completed by {claim.brand} on {fmtDate(claim.completedAt)}
                </div>
            )}
        </div>
    );
}


