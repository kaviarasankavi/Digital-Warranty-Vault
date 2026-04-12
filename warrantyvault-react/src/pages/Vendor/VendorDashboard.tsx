import { useState, useEffect } from 'react';
import {
    Package, ShieldCheck, ClipboardList, Tag,
    TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight,
    Star, Zap, Activity, BarChart3, Plus,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { productApi, Product } from '../../api/productApi';
import { analyticsApi } from '../../api/analyticsApi';
import './VendorDashboard.css';

export default function VendorDashboard() {
    const { user } = useAuthStore();
    const [products, setProducts] = useState<Product[]>([]);
    const [categorySummary, setCategorySummary] = useState<any>({});
    const [monthlyData, setMonthlyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const [catRes, monthRes, prodRes] = await Promise.all([
                    analyticsApi.getCategorySummary(),
                    analyticsApi.getMonthlySpending(),
                    productApi.getAll({ limit: 6, sortBy: 'createdAt', sortOrder: 'desc' }),
                ]);
                setCategorySummary(catRes.summary);
                setMonthlyData(monthRes.data);
                setProducts(prodRes.data);
            } catch (e) {
                console.error('Vendor dashboard load error', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const kpis = [
        {
            label: 'Listed Products',
            value: categorySummary.totalProducts ?? 0,
            icon: Package,
            color: 'teal',
            delta: `${categorySummary.totalCategories ?? 0} categories`,
        },
        {
            label: 'Active Warranties',
            value: categorySummary.totalProducts ?? 0,
            icon: ShieldCheck,
            color: 'green',
            delta: 'All valid',
        },
        {
            label: 'Pending Orders',
            value: 0,
            icon: ClipboardList,
            color: 'amber',
            delta: '0 awaiting review',
        },
        {
            label: 'Total Revenue',
            value: `$${(categorySummary.totalSpend ?? 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'coral',
            delta: 'Lifetime value',
        },
    ];

    const maxBar = Math.max(...monthlyData.map((d: any) => d.totalSpend), 1);

    return (
        <div className="vd-dashboard">
            {/* Page Header */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">
                        Vendor <span className="vd-title-accent">Dashboard</span>
                    </h1>
                    <p className="vd-page-sub">
                        Welcome back, {user?.name ?? 'Vendor'} — here's your store at a glance
                    </p>
                </div>
                <div className="vd-header-actions">
                    <div className="vd-live-badge">
                        <span className="vd-live-dot" />
                        Live Data
                    </div>
                    <button className="vd-btn-primary" onClick={() => window.location.href = '/vendor/products'}>
                        <Plus size={15} />
                        Add Product
                    </button>
                </div>
            </div>

            {/* KPI Row */}
            <div className="vd-kpi-grid">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className={`vd-kpi-card kpi-vd-${kpi.color}`}>
                            <div className={`vd-kpi-icon kpi-vd-icon-${kpi.color}`}>
                                <Icon size={20} />
                            </div>
                            <div className="vd-kpi-value">{kpi.value}</div>
                            <div className="vd-kpi-label">{kpi.label}</div>
                            <div className="vd-kpi-delta">{kpi.delta}</div>
                        </div>
                    );
                })}
            </div>

            {/* Mid Grid */}
            <div className="vd-mid-grid">
                {/* Revenue Chart */}
                <div className="vd-card vd-chart-card">
                    <div className="vd-card-header">
                        <div className="vd-card-title-row">
                            <BarChart3 size={16} className="vd-card-title-icon" />
                            <h3 className="vd-card-title">Revenue Timeline</h3>
                        </div>
                        <span className="vd-badge vd-badge-teal">This Year</span>
                    </div>
                    <div className="vd-chart-body">
                        {loading ? (
                            <div className="vd-chart-loading">Loading chart…</div>
                        ) : (
                            <div className="vd-bar-chart">
                                {monthlyData.map((bar: any, i: number) => (
                                    <div key={bar.label} className="vd-bar-col">
                                        <div className="vd-bar-wrap">
                                            <div className="vd-bar-tooltip">${bar.totalSpend.toLocaleString()}</div>
                                            <div
                                                className={`vd-bar ${i === monthlyData.length - 1 ? 'vd-bar-hi' : ''}`}
                                                style={{ height: `${(bar.totalSpend / maxBar) * 100}%` }}
                                            />
                                        </div>
                                        <span className="vd-bar-label">{bar.label.split(' ')[0]}</span>
                                    </div>
                                ))}
                                {monthlyData.length === 0 && (
                                    <div className="vd-chart-empty">No spending data yet</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats Panel */}
                <div className="vd-card vd-quick-panel">
                    <div className="vd-card-header">
                        <div className="vd-card-title-row">
                            <Activity size={16} className="vd-card-title-icon" />
                            <h3 className="vd-card-title">Store Health</h3>
                        </div>
                    </div>
                    <div className="vd-health-list">
                        {[
                            { label: 'Products Listed',   val: categorySummary.totalProducts ?? 0,    icon: Package,       ok: true },
                            { label: 'Categories',        val: categorySummary.totalCategories ?? 0,  icon: Tag,           ok: true },
                            { label: 'Warranty Coverage', val: '100%',                                 icon: ShieldCheck,   ok: true },
                            { label: 'Expiring Warranties',val: 0,                                     icon: AlertTriangle, ok: true },
                            { label: 'Pending Claims',    val: 0,                                     icon: ClipboardList, ok: true },
                            { label: 'Verified Products', val: categorySummary.totalProducts ?? 0,    icon: CheckCircle,   ok: true },
                        ].map((row) => {
                            const Icon = row.icon;
                            return (
                                <div key={row.label} className="vd-health-row">
                                    <div className={`vd-health-icon ${row.ok ? 'ok' : 'warn'}`}>
                                        <Icon size={14} />
                                    </div>
                                    <span className="vd-health-label">{row.label}</span>
                                    <span className="vd-health-val">{row.val}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Performance Highlights */}
                <div className="vd-card vd-perf-panel">
                    <div className="vd-card-header">
                        <div className="vd-card-title-row">
                            <Star size={16} className="vd-card-title-icon" />
                            <h3 className="vd-card-title">Highlights</h3>
                        </div>
                    </div>
                    <div className="vd-highlights">
                        <div className="vd-highlight-item hi-teal">
                            <Zap size={18} />
                            <div>
                                <div className="vd-hi-val">{categorySummary.totalProducts ?? 0}</div>
                                <div className="vd-hi-label">Total Products</div>
                            </div>
                        </div>
                        <div className="vd-highlight-item hi-amber">
                            <TrendingUp size={18} />
                            <div>
                                <div className="vd-hi-val">${(categorySummary.totalSpend ?? 0).toLocaleString()}</div>
                                <div className="vd-hi-label">Asset Value</div>
                            </div>
                        </div>
                        <div className="vd-highlight-item hi-indigo">
                            <CheckCircle size={18} />
                            <div>
                                <div className="vd-hi-val">100%</div>
                                <div className="vd-hi-label">Verified Rate</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Products Table */}
            <div className="vd-card">
                <div className="vd-card-header">
                    <div className="vd-card-title-row">
                        <Package size={16} className="vd-card-title-icon" />
                        <h3 className="vd-card-title">Recent Products</h3>
                    </div>
                    <a href="/vendor/products" className="vd-card-link">
                        View all <ArrowUpRight size={13} />
                    </a>
                </div>
                <div className="vd-table-wrap">
                    <table className="vd-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Brand</th>
                                <th>Category</th>
                                <th>Serial No.</th>
                                <th>Price</th>
                                <th>Added</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '2rem' }}>
                                        Loading products…
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '2rem' }}>
                                        No products yet
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ color: '#fff', fontWeight: 600 }}>{p.name}</td>
                                        <td>{p.brand}</td>
                                        <td>
                                            <span className="vd-badge vd-badge-indigo">{p.category}</span>
                                        </td>
                                        <td className="vd-mono">{p.serialNumber}</td>
                                        <td style={{ color: '#2dd4bf', fontWeight: 700 }}>
                                            ${Number(p.purchasePrice).toLocaleString()}
                                        </td>
                                        <td className="vd-mono">
                                            {new Date(p.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span className="vd-badge vd-badge-teal">
                                                <CheckCircle size={9} /> Active
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
