import { useState, useEffect, useCallback } from 'react';
import {
    GitBranch, User, Package, ShieldCheck, Award,
    Clock, CheckCircle, XCircle, RefreshCw, Search,
    AlertTriangle, ChevronRight, Shield, Sparkles,
    Hash, Mail, Calendar, FileCheck,
} from 'lucide-react';
import { graphApi, AuditTrailEntry } from '../../api/graphApi';
import { productApi, Product } from '../../api/productApi';
import './AuditTrail.css';

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('en-IN', {
        day:    '2-digit', month:  'short',  year:   'numeric',
        hour:   '2-digit', minute: '2-digit',
    }) : '—';

type TrailStatus = 'pending' | 'verified' | 'rejected';

const STATUS_CONFIG: Record<TrailStatus, { label: string; icon: React.ElementType; cls: string }> = {
    pending:  { label: 'Pending',  icon: Clock,         cls: 'ats-pending'  },
    verified: { label: 'Verified', icon: CheckCircle,   cls: 'ats-verified' },
    rejected: { label: 'Rejected', icon: XCircle,       cls: 'ats-rejected' },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function AuditTrail() {
    const [products,   setProducts]   = useState<Product[]>([]);
    const [trails,     setTrails]     = useState<AuditTrailEntry[]>([]);
    const [selected,   setSelected]   = useState<Product | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [searching,  setSearching]  = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error,      setError]      = useState<string | null>(null);

    // Load user's products + their existing trails on mount
    const loadInitial = useCallback(async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        setError(null);
        try {
            const [pRes, tRes] = await Promise.all([
                productApi.getAll({ limit: 100 }),
                graphApi.getMyTrails(),
            ]);
            setProducts(pRes.data);
            setTrails(tRes.data);
        } catch (e: any) {
            setError('Failed to load audit trails. Make sure Neo4j is connected.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { loadInitial(); }, [loadInitial]);

    // Search by serial number when a product is selected
    const handleProductSelect = async (product: Product) => {
        setSelected(product);
        if (!product.serialNumber) {
            // filter from already loaded trails by product name
            const filtered = trails.filter(t =>
                t.product?.name === product.name ||
                t.verificationRequest?.productName === product.name
            );
            setTrails(filtered.length > 0 ? filtered : trails);
            return;
        }
        setSearching(true);
        setError(null);
        try {
            const res = await graphApi.getAuditTrailBySerial(product.serialNumber);
            setTrails(res.data);
        } catch {
            setError('No graph data found for this product yet.');
            setTrails([]);
        } finally {
            setSearching(false);
        }
    };

    const handleClearSelection = () => {
        setSelected(null);
        loadInitial(true);
    };

    const stats = {
        total:    trails.length,
        verified: trails.filter(t => t.verificationRequest?.status === 'verified').length,
        pending:  trails.filter(t => t.verificationRequest?.status === 'pending').length,
        rejected: trails.filter(t => t.verificationRequest?.status === 'rejected').length,
    };

    return (
        <div className="at-page">
            {/* Header */}
            <div className="at-header">
                <div className="at-header-left">
                    <div className="at-header-icon">
                        <GitBranch size={22} />
                    </div>
                    <div>
                        <h2 className="at-title">Authenticity Audit Trail</h2>
                        <p className="at-subtitle">
                            Powered by Neo4j · Full graph provenance for your verified products
                        </p>
                    </div>
                </div>
                <button
                    className={`at-refresh-btn ${refreshing ? 'at-spinning' : ''}`}
                    onClick={() => selected ? handleProductSelect(selected) : loadInitial(true)}
                    title="Refresh"
                >
                    <RefreshCw size={15} />
                </button>
            </div>

            {/* Stats bar */}
            <div className="at-stats">
                {[
                    { label: 'Total Requests', val: stats.total,    icon: GitBranch,   cls: 'at-stat-blue'   },
                    { label: 'Verified',        val: stats.verified, icon: CheckCircle, cls: 'at-stat-green'  },
                    { label: 'Pending',         val: stats.pending,  icon: Clock,       cls: 'at-stat-amber'  },
                    { label: 'Rejected',        val: stats.rejected, icon: XCircle,     cls: 'at-stat-red'    },
                ].map(({ label, val, icon: Icon, cls }) => (
                    <div key={label} className={`at-stat-card ${cls}`}>
                        <div className="at-stat-icon"><Icon size={16} /></div>
                        <div className="at-stat-val">{val}</div>
                        <div className="at-stat-lbl">{label}</div>
                    </div>
                ))}
            </div>

            {/* Product filter */}
            <div className="at-filter-section">
                <div className="at-filter-header">
                    <Search size={15} />
                    <span>Filter by Product</span>
                    {selected && (
                        <button className="at-clear-btn" onClick={handleClearSelection}>
                            × Clear filter
                        </button>
                    )}
                </div>
                <div className="at-product-chips">
                    {products.length === 0 && !loading && (
                        <span className="at-no-products">No products in vault</span>
                    )}
                    {products.map(p => (
                        <button
                            key={p.id}
                            className={`at-chip ${selected?.id === p.id ? 'at-chip-active' : ''}`}
                            onClick={() => handleProductSelect(p)}
                        >
                            <Package size={12} />
                            {p.name}
                            {p.brand && <span className="at-chip-brand">{p.brand}</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading || searching ? (
                <div className="at-loading">
                    <div className="at-spinner" />
                    <span>{searching ? 'Querying Neo4j graph…' : 'Loading…'}</span>
                </div>
            ) : error ? (
                <div className="at-error">
                    <AlertTriangle size={24} />
                    <p>{error}</p>
                    {selected && (
                        <p className="at-error-hint">
                            Submit a verification request for <strong>{selected.name}</strong> first, then the trail will appear here.
                        </p>
                    )}
                </div>
            ) : trails.length === 0 ? (
                <div className="at-empty">
                    <GitBranch size={40} />
                    <h3>No audit trails yet</h3>
                    <p>
                        {selected
                            ? `No verification requests found for "${selected.name}" in the graph.`
                            : 'Submit a verification request and once processed, the full graph trail will appear here.'}
                    </p>
                </div>
            ) : (
                <div className="at-trails">
                    {trails.map((entry, idx) => (
                        <TrailCard key={entry.verificationRequest?.requestId ?? idx} entry={entry} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── TrailCard — renders one full authenticity trail ───────────────────────────

function TrailCard({ entry }: { entry: AuditTrailEntry }) {
    const vr     = entry.verificationRequest;
    const status = (vr?.status ?? 'pending') as TrailStatus;
    const cfg    = STATUS_CONFIG[status];
    const Icon   = cfg.icon;

    return (
        <div className={`at-trail-card at-trail-${status}`}>
            {/* Card header */}
            <div className="at-trail-header">
                <div className="at-trail-title-row">
                    <span className={`at-status-badge ${cfg.cls}`}>
                        <Icon size={12} /> {cfg.label}
                    </span>
                    <span className="at-trail-product">{vr?.productName ?? entry.product?.name ?? '—'}</span>
                    <span className="at-trail-brand">{vr?.brand ?? entry.product?.brand ?? ''}</span>
                </div>
                {vr?.serialNumber && (
                    <div className="at-serial-row">
                        <Hash size={11} />
                        <span className="at-serial">{vr.serialNumber}</span>
                    </div>
                )}
            </div>

            {/* Graph flow visualization */}
            <div className="at-graph-flow">
                {/* Node: User */}
                <GraphNode
                    icon={User}
                    label="User"
                    cls="gn-user"
                    lines={[
                        entry.user?.name  ?? '—',
                        entry.user?.email ?? '',
                    ]}
                />

                <FlowArrow label="REQUESTED_VERIFICATION" />

                {/* Node: Verification Request */}
                <GraphNode
                    icon={Shield}
                    label="Verification Request"
                    cls="gn-request"
                    lines={[
                        `Status: ${status.toUpperCase()}`,
                        `Submitted: ${fmtDate(vr?.requestedAt)}`,
                    ]}
                />

                <FlowArrow label="FOR_PRODUCT" />

                {/* Node: Product */}
                <GraphNode
                    icon={Package}
                    label="Product"
                    cls="gn-product"
                    lines={[
                        entry.product?.name  ?? vr?.productName ?? '—',
                        entry.product?.brand ?? vr?.brand ?? '',
                    ]}
                />

                <FlowArrow label="SENT_TO" />

                {/* Node: Vendor */}
                <GraphNode
                    icon={Sparkles}
                    label="Vendor"
                    cls="gn-vendor"
                    lines={[
                        entry.vendor?.brand ?? vr?.brand ?? '—',
                        entry.vendor?.email ?? '',
                    ]}
                />

                {/* Conditional branch: verified or rejected */}
                {status !== 'pending' && (
                    <>
                        <FlowArrow label={status === 'verified' ? 'VERIFIED' : 'REJECTED'} cls={status === 'verified' ? 'fa-verified' : 'fa-rejected'} />
                        <GraphNode
                            icon={status === 'verified' ? ShieldCheck : XCircle}
                            label={status === 'verified' ? 'Verification Approved' : 'Verification Rejected'}
                            cls={status === 'verified' ? 'gn-verified' : 'gn-rejected'}
                            lines={[
                                status === 'verified'
                                    ? `At: ${fmtDate(vr?.verifiedAt)}`
                                    : `At: ${fmtDate(vr?.rejectedAt ?? vr?.verifiedAt)}`,
                                vr?.vendorNote ? `Note: "${vr.vendorNote}"` : '',
                            ]}
                        />
                    </>
                )}

                {/* Certificate node */}
                {entry.certificate && (
                    <>
                        <FlowArrow label="RESULTED_IN" cls="fa-verified" />
                        <GraphNode
                            icon={Award}
                            label="Certificate Issued"
                            cls="gn-cert"
                            lines={[
                                `ID: ${entry.certificate.certificateId}`,
                                `Issued: ${fmtDate(entry.certificate.issuedAt)}`,
                            ]}
                        />
                    </>
                )}
            </div>

            {/* Metadata row */}
            <div className="at-meta-row">
                {entry.user?.email && (
                    <span className="at-meta-item">
                        <Mail size={11} /> {entry.user.email}
                    </span>
                )}
                {vr?.requestedAt && (
                    <span className="at-meta-item">
                        <Calendar size={11} /> {fmtDate(vr.requestedAt)}
                    </span>
                )}
                {entry.certificate && (
                    <span className="at-meta-item at-meta-cert">
                        <FileCheck size={11} /> Cert: {entry.certificate.certificateId}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Sub components ─────────────────────────────────────────────────────────────

function GraphNode({
    icon: Icon, label, cls, lines,
}: {
    icon: React.ElementType;
    label: string;
    cls:   string;
    lines: string[];
}) {
    return (
        <div className={`at-graph-node ${cls}`}>
            <div className="gn-icon-wrap">
                <Icon size={16} />
            </div>
            <div className="gn-content">
                <div className="gn-label">{label}</div>
                {lines.filter(Boolean).map((l, i) => (
                    <div key={i} className="gn-line">{l}</div>
                ))}
            </div>
        </div>
    );
}

function FlowArrow({ label, cls = '' }: { label: string; cls?: string }) {
    return (
        <div className={`at-flow-arrow ${cls}`}>
            <div className="fa-line" />
            <ChevronRight size={14} className="fa-chevron" />
            <span className="fa-label">{label}</span>
        </div>
    );
}
