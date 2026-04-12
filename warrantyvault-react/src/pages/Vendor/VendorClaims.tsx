import { useState, useEffect, useCallback } from 'react';
import {
    Wrench, MapPin, Calendar, Clock, CheckCircle, XCircle,
    RefreshCw, Package, User, Phone, Inbox, Shield, FileText,
} from 'lucide-react';
import { warrantyClaimApi, WarrantyClaim, ClaimStatus } from '../../api/warrantyClaimApi';
import { useAuthStore } from '../../store/authStore';
import './VendorClaims.css';

type Tab = 'submitted' | 'reviewed' | 'scheduled' | 'completed' | 'rejected' | 'all';

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUS_COLOR: Record<ClaimStatus, string> = {
    submitted: '#fbbf24',
    reviewed:  '#a78bfa',
    scheduled: '#60a5fa',
    completed: '#2dd4bf',
    rejected:  '#fb7185',
};

export default function VendorClaims() {
    const { user }           = useAuthStore();
    const [claims,     setClaims]     = useState<WarrantyClaim[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab,  setActiveTab]  = useState<Tab>('submitted');
    const [processing, setProcessing] = useState<string | null>(null);
    const [toast,      setToast]      = useState<{ ok: boolean; text: string } | null>(null);

    // Per-card schedule state
    const [schedDateMap, setSchedDateMap]   = useState<Record<string, string>>({});
    const [schedTimeMap, setSchedTimeMap]   = useState<Record<string, string>>({});
    const [msgMap,       setMsgMap]         = useState<Record<string, string>>({});
    const [rejectMap,    setRejectMap]       = useState<Record<string, string>>({});
    const [expanded,     setExpanded]        = useState<string | null>(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try {
            const data = await warrantyClaimApi.getVendorClaims(activeTab === 'all' ? undefined : activeTab);
            setClaims(data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [activeTab]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { const id = setInterval(() => load(true), 20000); return () => clearInterval(id); }, [load]);

    const showToast = (ok: boolean, text: string) => {
        setToast({ ok, text });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSchedule = async (claim: WarrantyClaim) => {
        const date = schedDateMap[claim._id];
        const time = schedTimeMap[claim._id];
        if (!date || !time) { showToast(false, 'Set both date and time before scheduling.'); return; }
        setProcessing(claim._id);
        try {
            await warrantyClaimApi.schedule(claim._id, { scheduledDate: date, scheduledTime: time, vendorMessage: msgMap[claim._id] ?? '' });
            showToast(true, `Visit scheduled for ${date} at ${time}`);
            load(true);
        } catch (e: any) { showToast(false, e?.response?.data?.message ?? 'Schedule failed.'); }
        finally { setProcessing(null); }
    };

    const handleComplete = async (claim: WarrantyClaim) => {
        setProcessing(claim._id);
        try {
            await warrantyClaimApi.complete(claim._id, msgMap[claim._id]);
            showToast(true, 'Claim marked as completed.');
            load(true);
        } catch (e: any) { showToast(false, 'Failed to complete.'); }
        finally { setProcessing(null); }
    };

    const handleReject = async (claim: WarrantyClaim) => {
        setProcessing(claim._id);
        try {
            await warrantyClaimApi.reject(claim._id, rejectMap[claim._id], msgMap[claim._id]);
            showToast(false, 'Claim rejected.');
            load(true);
        } catch (e: any) { showToast(false, 'Failed to reject.'); }
        finally { setProcessing(null); }
    };

    const brand = user?.email?.split('@')[1]?.split('.')[0] ?? 'Brand';

    const tabs: { key: Tab; label: string }[] = [
        { key: 'submitted', label: 'New'       },
        { key: 'reviewed',  label: 'Reviewed'  },
        { key: 'scheduled', label: 'Scheduled' },
        { key: 'completed', label: 'Completed' },
        { key: 'rejected',  label: 'Rejected'  },
        { key: 'all',       label: 'All'       },
    ];

    return (
        <div className="vc-page">
            {/* Header */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">
                        Warranty <span className="vd-title-accent">Claims</span>
                    </h1>
                    <p className="vd-page-sub">
                        Repair requests from <strong style={{ color:'#2dd4bf', textTransform:'capitalize' }}>{brand}</strong> customers
                    </p>
                </div>
                <button className={`vd-btn-secondary ${refreshing ? 'vc-refreshing' : ''}`} onClick={() => load(true)}>
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Tabs */}
            <div className="vc-tabs">
                {tabs.map(t => (
                    <button key={t.key}
                        className={`vc-tab ${activeTab === t.key ? 'vc-tab-active' : ''}`}
                        style={activeTab === t.key && t.key !== 'all'
                            ? { color: STATUS_COLOR[t.key as ClaimStatus] ?? '#94a3b8', borderColor: `${STATUS_COLOR[t.key as ClaimStatus]}40`, background: `${STATUS_COLOR[t.key as ClaimStatus]}15` }
                            : {}}
                        onClick={() => setActiveTab(t.key)}
                    >
                        {t.label}
                        {activeTab === t.key && claims.length > 0 && (
                            <span className="vc-count">{claims.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Toast */}
            {toast && (
                <div className={`vc-toast ${toast.ok ? 'vc-toast-ok' : 'vc-toast-err'}`}>
                    {toast.ok ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {toast.text}
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="vc-loading"><div className="vd-loader-ring" />Loading claims…</div>
            ) : claims.length === 0 ? (
                <div className="vc-empty">
                    <div className="vc-empty-icon"><Inbox size={40} /></div>
                    <h3>No {activeTab === 'all' ? '' : activeTab} claims</h3>
                    <p>No warranty claims in this status.</p>
                </div>
            ) : (
                <div className="vc-list">
                    {claims.map(c => {
                        const isExp = expanded === c._id;
                        return (
                            <div key={c._id} className={`vc-card vc-card-${c.status}`}>
                                {/* Card header */}
                                <div className="vc-card-top">
                                    <div className="vc-prod-icon"><Package size={18} /></div>
                                    <div className="vc-card-info">
                                        <div className="vc-prod-name">{c.productName}</div>
                                        <div className="vc-claim-num">{c.claimNumber}</div>
                                        <div className="vc-prod-brand">{c.brand}</div>
                                    </div>
                                    <span className="vc-status-dot" style={{ background: STATUS_COLOR[c.status] }} />
                                    <span className="vc-status-text" style={{ color: STATUS_COLOR[c.status] }}>
                                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                                    </span>
                                    {c.isEscalated && (
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '99px', background: '#fef3c7', color: '#b45309', fontWeight: 700, marginLeft: '0.5rem', border: '1px solid #fde68a' }}>
                                            ESCALATED
                                        </span>
                                    )}
                                    <button className="vc-expand-btn" onClick={() => setExpanded(isExp ? null : c._id)}>
                                        {isExp ? '▲ Less' : '▼ Details'}
                                    </button>
                                </div>

                                {/* Quick info row (always visible) */}
                                <div className="vc-quick-row">
                                    <span><User size={11} />{c.userName}</span>
                                    {c.userPhone && <span><Phone size={11} />{c.userPhone}</span>}
                                    <span><MapPin size={11} />{c.location.city}, {c.location.state}</span>
                                    <span><FileText size={11} />{c.defectType || 'N/A'}</span>
                                    <span><Clock size={11} />{fmtDate(c.submittedAt)}</span>
                                </div>

                                {/* Scheduled banner */}
                                {c.status === 'scheduled' && c.scheduledDate && (
                                    <div className="vc-scheduled-bar">
                                        <Calendar size={13} />
                                        Visit scheduled: <strong>{c.scheduledDate}</strong> at <strong>{c.scheduledTime}</strong>
                                        &nbsp;·&nbsp; <MapPin size={11} /> {c.location.address}, {c.location.city}
                                    </div>
                                )}

                                {/* Expanded details */}
                                {isExp && (
                                    <div className="vc-details">
                                        <div className="vc-detail-grid">
                                            <div className="vc-detail">
                                                <span className="vc-dlabel">Serial No.</span>
                                                <span className="vc-dval vc-mono">{c.serialNumber || '—'}</span>
                                            </div>
                                            <div className="vc-detail">
                                                <span className="vc-dlabel">Customer Email</span>
                                                <span className="vc-dval vc-mono">{c.userEmail}</span>
                                            </div>
                                            <div className="vc-detail vc-detail-full">
                                                <span className="vc-dlabel"><MapPin size={11} />Full Location</span>
                                                <span className="vc-dval">
                                                    {c.location.address}, {c.location.city}, {c.location.state} - {c.location.pincode}
                                                    {c.location.landmark && ` (Near: ${c.location.landmark})`}
                                                </span>
                                            </div>
                                            <div className="vc-detail vc-detail-full">
                                                <span className="vc-dlabel"><Wrench size={11} />Defect Description</span>
                                                <span className="vc-dval">{c.defectDescription}</span>
                                            </div>
                                        </div>

                                        {/* Action panel — submitted / reviewed */}
                                        {(c.status === 'submitted' || c.status === 'reviewed') && (
                                            <div className="vc-action-panel">
                                                <div className="vc-action-title"><Calendar size={14} />Schedule a Service Visit</div>
                                                <div className="vc-action-grid">
                                                    <div className="vc-igroup">
                                                        <label>Visit Date <span className="vc-req">*</span></label>
                                                        <input type="date" className="vc-input"
                                                            min={new Date().toISOString().split('T')[0]}
                                                            value={schedDateMap[c._id] ?? ''}
                                                            onChange={e => setSchedDateMap(m => ({ ...m, [c._id]: e.target.value }))} />
                                                    </div>
                                                    <div className="vc-igroup">
                                                        <label>Visit Time <span className="vc-req">*</span></label>
                                                        <input type="time" className="vc-input"
                                                            value={schedTimeMap[c._id] ?? ''}
                                                            onChange={e => setSchedTimeMap(m => ({ ...m, [c._id]: e.target.value }))} />
                                                    </div>
                                                    <div className="vc-igroup vc-igroup-full">
                                                        <label>Message to customer</label>
                                                        <input className="vc-input" placeholder="e.g. Our technician will visit the location with tools…"
                                                            value={msgMap[c._id] ?? ''}
                                                            onChange={e => setMsgMap(m => ({ ...m, [c._id]: e.target.value }))} />
                                                    </div>
                                                </div>
                                                <div className="vc-action-btns">
                                                    <button className="vc-btn-schedule"
                                                        disabled={processing === c._id || !schedDateMap[c._id] || !schedTimeMap[c._id]}
                                                        onClick={() => handleSchedule(c)}>
                                                        {processing === c._id
                                                            ? <><div className="vc-spin" />Processing…</>
                                                            : <><Calendar size={14} />Schedule Visit</>}
                                                    </button>
                                                    <button className="vc-btn-reject"
                                                        disabled={processing === c._id}
                                                        onClick={() => handleReject(c)}>
                                                        <XCircle size={14} />Reject
                                                    </button>
                                                </div>
                                                <div className="vc-igroup" style={{ marginTop:'.25rem' }}>
                                                    <label>Rejection reason (if rejecting)</label>
                                                    <input className="vc-input" placeholder="e.g. Product out of warranty coverage…"
                                                        value={rejectMap[c._id] ?? ''}
                                                        onChange={e => setRejectMap(m => ({ ...m, [c._id]: e.target.value }))} />
                                                </div>
                                            </div>
                                        )}

                                        {/* Action panel — scheduled */}
                                        {c.status === 'scheduled' && (
                                            <div className="vc-action-panel">
                                                <div className="vc-action-title"><CheckCircle size={14} />Mark as Completed</div>
                                                <div className="vc-igroup">
                                                    <label>Completion note to customer</label>
                                                    <input className="vc-input" placeholder="e.g. Screen replaced and tested successfully…"
                                                        value={msgMap[c._id] ?? ''}
                                                        onChange={e => setMsgMap(m => ({ ...m, [c._id]: e.target.value }))} />
                                                </div>
                                                <div className="vc-action-btns">
                                                    <button className="vc-btn-complete"
                                                        disabled={processing === c._id}
                                                        onClick={() => handleComplete(c)}>
                                                        {processing === c._id
                                                            ? <><div className="vc-spin" />Processing…</>
                                                            : <><CheckCircle size={14} />Mark Completed</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Prior vendor message */}
                                        {c.vendorMessage && c.status !== 'submitted' && (
                                            <div className="vc-sent-msg">
                                                <Shield size={12} />Sent message: "{c.vendorMessage}"
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
