import { useDataStore } from '../../store/dataStore';
import {
    Package, ShieldCheck, Users, ScanLine, TrendingUp,
    AlertTriangle, CheckCircle, XCircle, Activity,
    ArrowUpRight, Shield
} from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const { products, warranties, owners, verificationChecks } = useDataStore();

    const stats = {
        totalProducts: products.length,
        totalWarranties: warranties.length,
        activeWarranties: warranties.filter((w) => w.status === 'active').length,
        expiringWarranties: warranties.filter((w) => w.status === 'expiring').length,
        expiredWarranties: warranties.filter((w) => w.status === 'expired').length,
        totalOwners: owners.length,
        verifiedOwners: owners.filter((o) => o.status === 'verified').length,
        pendingOwners: owners.filter((o) => o.status === 'pending').length,
        totalChecks: verificationChecks.length,
        successfulChecks: verificationChecks.filter((c) => c.result).length,
        failedChecks: verificationChecks.filter((c) => !c.result).length,
    };

    const kpis = [
        { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'indigo', delta: '+3 this week' },
        { label: 'Active Warranties', value: stats.activeWarranties, icon: ShieldCheck, color: 'green', delta: `${stats.expiringWarranties} expiring soon` },
        { label: 'Registered Owners', value: stats.totalOwners, icon: Users, color: 'coral', delta: `${stats.pendingOwners} pending review` },
        { label: 'Auth Checks', value: stats.totalChecks, icon: ScanLine, color: 'amber', delta: `${stats.failedChecks} flagged` },
    ];

    return (
        <div className="admin-dashboard">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">System Dashboard</h1>
                    <p className="admin-page-sub">Live overview of all vault entities — changes update instantly across the portal</p>
                </div>
                <div className="admin-live-badge">
                    <span className="admin-live-dot" />
                    Live Data
                </div>
            </div>

            {/* KPI Grid */}
            <div className="admin-kpi-grid">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className={`admin-kpi-card kpi-${kpi.color}`}>
                            <div className={`admin-kpi-icon-wrap kpi-icon-${kpi.color}`}>
                                <Icon size={20} />
                            </div>
                            <div className="admin-kpi-value">{kpi.value}</div>
                            <div className="admin-kpi-label">{kpi.label}</div>
                            <div className="admin-kpi-delta">{kpi.delta}</div>
                        </div>
                    );
                })}
            </div>

            {/* Middle section */}
            <div className="admin-mid-grid">
                {/* Warranty Breakdown */}
                <div className="admin-card admin-warranty-breakdown">
                    <div className="admin-card-header">
                        <div className="admin-card-title-row">
                            <Activity size={16} className="admin-card-title-icon" />
                            <h3 className="admin-card-title">Warranty Status Breakdown</h3>
                        </div>
                    </div>
                    <div className="breakdown-items">
                        {[
                            { label: 'Active', count: stats.activeWarranties, pct: Math.round((stats.activeWarranties / stats.totalWarranties) * 100), color: '#4ade80' },
                            { label: 'Expiring Soon', count: stats.expiringWarranties, pct: Math.round((stats.expiringWarranties / stats.totalWarranties) * 100), color: '#fbbf24' },
                            { label: 'Expired', count: stats.expiredWarranties, pct: Math.round((stats.expiredWarranties / stats.totalWarranties) * 100), color: '#6b7280' },
                            { label: 'Claimed', count: warranties.filter((w) => w.status === 'claimed').length, pct: Math.round((warranties.filter((w) => w.status === 'claimed').length / stats.totalWarranties) * 100), color: '#818cf8' },
                        ].map((item) => (
                            <div key={item.label} className="breakdown-item">
                                <div className="breakdown-label-row">
                                    <span className="breakdown-label">{item.label}</span>
                                    <span className="breakdown-count">{item.count}</span>
                                </div>
                                <div className="breakdown-bar-track">
                                    <div className="breakdown-bar-fill" style={{ width: `${item.pct}%`, background: item.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Owner Status */}
                <div className="admin-card admin-owner-status">
                    <div className="admin-card-header">
                        <div className="admin-card-title-row">
                            <Users size={16} className="admin-card-title-icon" />
                            <h3 className="admin-card-title">Owner Registry</h3>
                        </div>
                    </div>
                    <div className="owner-status-list">
                        {owners.map((owner) => (
                            <div key={owner.id} className="owner-status-row">
                                <div className={`owner-status-avatar ${owner.colorClass}`}>{owner.initials}</div>
                                <div className="owner-status-info">
                                    <p className="owner-status-name">{owner.name}</p>
                                    <p className="owner-status-email">{owner.email}</p>
                                </div>
                                <span className={`abadge ${owner.status === 'verified' ? 'abadge-green' : owner.status === 'pending' ? 'abadge-amber' : 'abadge-red'}`}>
                                    {owner.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Verification Stats */}
                <div className="admin-card admin-verify-stats">
                    <div className="admin-card-header">
                        <div className="admin-card-title-row">
                            <Shield size={16} className="admin-card-title-icon" />
                            <h3 className="admin-card-title">Auth Checks</h3>
                        </div>
                    </div>
                    <div className="verify-stat-big">
                        <div className="verify-big-num" style={{ color: '#4ade80' }}>{stats.successfulChecks}</div>
                        <div className="verify-big-label">Verified Authentic</div>
                    </div>
                    <div className="verify-stat-big">
                        <div className="verify-big-num" style={{ color: '#f87171' }}>{stats.failedChecks}</div>
                        <div className="verify-big-label">Flagged / Failed</div>
                    </div>
                    <div className="verify-rate">
                        <TrendingUp size={14} />
                        <span>{Math.round((stats.successfulChecks / stats.totalChecks) * 100)}% success rate</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-card admin-recent-activity">
                <div className="admin-card-header">
                    <div className="admin-card-title-row">
                        <Activity size={16} className="admin-card-title-icon" />
                        <h3 className="admin-card-title">Recent Verification Checks</h3>
                    </div>
                    <a href="/admin/verify" className="admin-card-link">View all <ArrowUpRight size={13} /></a>
                </div>
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Check ID</th>
                                <th>Product</th>
                                <th>Serial Hash</th>
                                <th>Owner</th>
                                <th>Checked At</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {verificationChecks.slice(0, 5).map((check) => (
                                <tr key={check.id}>
                                    <td className="admin-mono">{check.id}</td>
                                    <td style={{ color: '#fff', fontWeight: 600 }}>{check.productName}</td>
                                    <td className="admin-mono">{check.serialHash}</td>
                                    <td>{check.ownerName}</td>
                                    <td className="admin-mono">{check.checkedAt}</td>
                                    <td>
                                        {check.result ? (
                                            <span className="abadge abadge-green"><CheckCircle size={10} /> Authentic</span>
                                        ) : (
                                            <span className="abadge abadge-red"><XCircle size={10} /> Flagged</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
