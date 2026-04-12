import { useState, useEffect } from 'react';
import {
    BarChart3,
    PieChart,
    TrendingUp,
    Tag,
    DollarSign,
    Database,
    AlertCircle,
    RefreshCw,
    Layers,
    Award,
} from 'lucide-react';

import {
    analyticsApi,
    CategorySummaryItem,
    WarrantyStatusItem,
    MonthlySpendingItem,
    BrandAnalyticsItem,
    PriceDistributionItem,
} from '../../api/analyticsApi';
import './Analytics.css';

// ── Color palette for charts ─────────────────────────────────────────────────
const CATEGORY_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
    '#10b981', '#06b6d4', '#3b82f6', '#f97316', '#84cc16',
];

// ── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
    return (
        <div>
            <div className="analytics-skeleton skeleton-bar" />
            <div className="analytics-skeleton skeleton-bar" />
            <div className="analytics-skeleton skeleton-bar" />
            <div className="analytics-skeleton skeleton-bar" />
        </div>
    );
}

// ── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="analytics-error">
            <div className="analytics-error-icon">
                <AlertCircle size={24} />
            </div>
            <p>{message}</p>
            <button className="analytics-retry-btn" onClick={onRetry}>
                <RefreshCw size={14} style={{ marginRight: '0.375rem' }} />
                Retry
            </button>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
    const [categoryData, setCategoryData] = useState<CategorySummaryItem[]>([]);
    const [warrantyData, setWarrantyData] = useState<WarrantyStatusItem[]>([]);
    const [monthlyData, setMonthlyData] = useState<MonthlySpendingItem[]>([]);
    const [brandData, setBrandData] = useState<BrandAnalyticsItem[]>([]);
    const [priceData, setPriceData] = useState<PriceDistributionItem[]>([]);

    const [categorySummary, setCategorySummary] = useState<Record<string, number>>({});
    const [warrantySummary, setWarrantySummary] = useState<Record<string, number>>({});
    const [monthlySummary, setMonthlySummary] = useState<Record<string, number>>({});
    const [brandSummary, setBrandSummary] = useState<Record<string, number>>({});
    const [priceSummary, setPriceSummary] = useState<Record<string, number>>({});

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchAll = async () => {
        setLoading(true);
        setErrors({});

        const results = await Promise.allSettled([
            analyticsApi.getCategorySummary(),
            analyticsApi.getWarrantyStatus(),
            analyticsApi.getMonthlySpending(),
            analyticsApi.getBrandAnalytics(),
            analyticsApi.getPriceDistribution(),
        ]);

        if (results[0].status === 'fulfilled') {
            setCategoryData(results[0].value.data);
            setCategorySummary(results[0].value.summary);
        } else {
            setErrors(prev => ({ ...prev, category: 'Failed to load category data' }));
        }

        if (results[1].status === 'fulfilled') {
            setWarrantyData(results[1].value.data);
            setWarrantySummary(results[1].value.summary);
        } else {
            setErrors(prev => ({ ...prev, warranty: 'Failed to load warranty data' }));
        }

        if (results[2].status === 'fulfilled') {
            setMonthlyData(results[2].value.data);
            setMonthlySummary(results[2].value.summary);
        } else {
            setErrors(prev => ({ ...prev, monthly: 'Failed to load spending data' }));
        }

        if (results[3].status === 'fulfilled') {
            setBrandData(results[3].value.data);
            setBrandSummary(results[3].value.summary);
        } else {
            setErrors(prev => ({ ...prev, brand: 'Failed to load brand data' }));
        }

        if (results[4].status === 'fulfilled') {
            setPriceData(results[4].value.data);
            setPriceSummary(results[4].value.summary);
        } else {
            setErrors(prev => ({ ...prev, price: 'Failed to load price data' }));
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    // ── Donut chart helpers ──────────────────────────────────────────────────
    const totalWarranties = warrantyData.reduce((s, w) => s + w.count, 0);
    const donutRadius = 70;
    const donutCircumference = 2 * Math.PI * donutRadius;
    let donutOffset = 0;

    // ── Monthly chart max ────────────────────────────────────────────────────
    const maxMonthlySpend = Math.max(...monthlyData.map(m => m.totalSpend), 1);

    // ── Price distribution max ───────────────────────────────────────────────
    const maxPriceCount = Math.max(...priceData.map(p => p.count), 1);

    // ── Brand max value ──────────────────────────────────────────────────────
    const maxBrandValue = Math.max(...brandData.map(b => b.totalValue), 1);

    return (
        <div className="analytics-page">



            <div className="analytics-content">
                {/* ── 1. Category Summary (Horizontal Bar) ────────────────── */}
                <div className="analytics-grid-2">
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div className="analytics-card-title-group">
                                <div className="analytics-card-icon icon-indigo">
                                    <BarChart3 size={18} />
                                </div>
                                <div>
                                    <h3 className="analytics-card-title">Category Distribution</h3>
                                    <p className="analytics-card-subtitle">Products grouped by category</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonLoader />
                        ) : errors.category ? (
                            <ErrorState message={errors.category} onRetry={fetchAll} />
                        ) : (
                            <>
                                <div className="hbar-chart">
                                    {categoryData.map((cat, i) => (
                                        <div key={cat.category} className="hbar-row">
                                            <span className="hbar-label">{cat.category}</span>
                                            <div className="hbar-track">
                                                <div
                                                    className="hbar-fill"
                                                    style={{
                                                        width: `${cat.percentage}%`,
                                                        background: `linear-gradient(90deg, ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}, ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}cc)`,
                                                    }}
                                                >
                                                    {cat.percentage > 15 && (
                                                        <span className="hbar-fill-text">{cat.productCount}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="hbar-value">{cat.percentage}%</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-stats-row">
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{categorySummary.totalCategories}</div>
                                        <div className="summary-stat-label">Categories</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{categorySummary.totalProducts}</div>
                                        <div className="summary-stat-label">Products</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">
                                            ${Math.round(categorySummary.totalSpend || 0).toLocaleString()}
                                        </div>
                                        <div className="summary-stat-label">Total Spend</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── 2. Warranty Status (Donut) ───────────────────────── */}
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div className="analytics-card-title-group">
                                <div className="analytics-card-icon icon-emerald">
                                    <PieChart size={18} />
                                </div>
                                <div>
                                    <h3 className="analytics-card-title">Warranty Status</h3>
                                    <p className="analytics-card-subtitle">Warranty breakdown by status</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonLoader />
                        ) : errors.warranty ? (
                            <ErrorState message={errors.warranty} onRetry={fetchAll} />
                        ) : (
                            <>
                                <div className="donut-container">
                                    <div className="donut-chart">
                                        <svg width="180" height="180" viewBox="0 0 180 180">
                                            {warrantyData.map((w) => {
                                                const pct = totalWarranties > 0 ? w.count / totalWarranties : 0;
                                                const dashLength = pct * donutCircumference;
                                                const gapLength = donutCircumference - dashLength;
                                                const currentOffset = donutOffset;
                                                donutOffset += dashLength;
                                                return (
                                                    <circle
                                                        key={w.status}
                                                        cx="90"
                                                        cy="90"
                                                        r={donutRadius}
                                                        fill="none"
                                                        stroke={w.color}
                                                        strokeWidth="16"
                                                        strokeDasharray={`${dashLength} ${gapLength}`}
                                                        strokeDashoffset={-currentOffset}
                                                        strokeLinecap="round"
                                                        style={{
                                                            transition: 'stroke-dasharray 1s ease, stroke-dashoffset 1s ease',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </svg>
                                        <div className="donut-center">
                                            <div className="donut-center-value">{totalWarranties}</div>
                                            <div className="donut-center-label">Total</div>
                                        </div>
                                    </div>
                                    <div className="donut-legend">
                                        {warrantyData.map((w) => (
                                            <div key={w.status} className="donut-legend-item">
                                                <div className="donut-legend-dot" style={{ background: w.color }} />
                                                <div className="donut-legend-text">
                                                    <div className="donut-legend-label">{w.label}</div>
                                                    <div className="donut-legend-count">{w.count} warranties</div>
                                                </div>
                                                <span className="donut-legend-pct">{w.percentage}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="summary-stats-row">
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{warrantySummary.totalWarranties}</div>
                                        <div className="summary-stat-label">Total Warranties</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{warrantySummary.totalClaims}</div>
                                        <div className="summary-stat-label">Total Claims</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── 3. Monthly Spending Trend (Vertical Bar) ─────────────── */}
                <div className="analytics-card">
                    <div className="analytics-card-header">
                        <div className="analytics-card-title-group">
                            <div className="analytics-card-icon icon-amber">
                                <TrendingUp size={18} />
                            </div>
                            <div>
                                <h3 className="analytics-card-title">Monthly Spending Trend</h3>
                                <p className="analytics-card-subtitle">Purchase spending aggregated by month</p>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <SkeletonLoader />
                    ) : errors.monthly ? (
                        <ErrorState message={errors.monthly} onRetry={fetchAll} />
                    ) : (
                        <>
                            <div className="vbar-chart">
                                {monthlyData.map((m, i) => {
                                    const heightPct = (m.totalSpend / maxMonthlySpend) * 100;
                                    const isMax = m.totalSpend === maxMonthlySpend;
                                    return (
                                        <div key={m.label} className="vbar-col">
                                            <div className="vbar-bar-wrap">
                                                <div
                                                    className={`vbar-bar ${isMax ? 'vbar-bar-highlight' : ''}`}
                                                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                                                >
                                                    <div className="vbar-tooltip">
                                                        ${m.totalSpend.toLocaleString()} • {m.productCount} items
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="vbar-label">{m.label.split(' ')[0]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="summary-stats-row">
                                <div className="summary-stat">
                                    <div className="summary-stat-value">{monthlySummary.totalMonths}</div>
                                    <div className="summary-stat-label">Months</div>
                                </div>
                                <div className="summary-stat">
                                    <div className="summary-stat-value">
                                        ${Math.round(monthlySummary.grandTotal || 0).toLocaleString()}
                                    </div>
                                    <div className="summary-stat-label">Grand Total</div>
                                </div>
                                <div className="summary-stat">
                                    <div className="summary-stat-value">{monthlySummary.totalProducts}</div>
                                    <div className="summary-stat-label">Products Purchased</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ── 4 & 5. Brand Analytics + Price Distribution ──────────── */}
                <div className="analytics-grid-2">
                    {/* ── 4. Brand Analytics ───────────────────────────────── */}
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div className="analytics-card-title-group">
                                <div className="analytics-card-icon icon-rose">
                                    <Award size={18} />
                                </div>
                                <div>
                                    <h3 className="analytics-card-title">Brand Insights</h3>
                                    <p className="analytics-card-subtitle">Investment by brand</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonLoader />
                        ) : errors.brand ? (
                            <ErrorState message={errors.brand} onRetry={fetchAll} />
                        ) : (
                            <>
                                <div className="brand-list">
                                    {brandData.slice(0, 8).map((b) => (
                                        <div key={b.brand} className="brand-card">
                                            <div
                                                className={`brand-rank ${
                                                    b.rank === 1
                                                        ? 'brand-rank-1'
                                                        : b.rank === 2
                                                        ? 'brand-rank-2'
                                                        : b.rank === 3
                                                        ? 'brand-rank-3'
                                                        : 'brand-rank-other'
                                                }`}
                                            >
                                                {b.rank}
                                            </div>
                                            <div className="brand-info">
                                                <div className="brand-name">{b.brand}</div>
                                                <div className="brand-progress-track">
                                                    <div
                                                        className="brand-progress-fill"
                                                        style={{
                                                            width: `${(b.totalValue / maxBrandValue) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <div className="brand-meta">
                                                    <span className="brand-meta-chip">{b.productCount} products</span>
                                                    <span className="brand-meta-chip">{b.categoryCount} categories</span>
                                                </div>
                                            </div>
                                            <div className="brand-value">
                                                <div className="brand-value-amount">{b.formattedValue}</div>
                                                <div className="brand-value-pct">{b.percentage}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-stats-row">
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{brandSummary.totalBrands}</div>
                                        <div className="summary-stat-label">Brands</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">
                                            ${Math.round(brandSummary.grandTotal || 0).toLocaleString()}
                                        </div>
                                        <div className="summary-stat-label">Total Investment</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── 5. Price Distribution ────────────────────────────── */}
                    <div className="analytics-card">
                        <div className="analytics-card-header">
                            <div className="analytics-card-title-group">
                                <div className="analytics-card-icon icon-violet">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <h3 className="analytics-card-title">Price Distribution</h3>
                                    <p className="analytics-card-subtitle">Products by price range</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <SkeletonLoader />
                        ) : errors.price ? (
                            <ErrorState message={errors.price} onRetry={fetchAll} />
                        ) : (
                            <>
                                <div className="price-histogram">
                                    {priceData.map((p) => (
                                        <div key={p.range} className="price-bucket">
                                            <span className="price-range-label">{p.label}</span>
                                            <div className="price-bar-track">
                                                <div
                                                    className="price-bar-fill"
                                                    style={{
                                                        width: `${(p.count / maxPriceCount) * 100}%`,
                                                    }}
                                                >
                                                    {p.count > 0 && (
                                                        <span className="price-bar-text">
                                                            {p.sampleProducts?.[0] || ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="price-count">
                                                <div className="price-count-num">{p.count}</div>
                                                <div className="price-count-pct">{p.percentage}%</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-stats-row">
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{priceSummary.totalBuckets}</div>
                                        <div className="summary-stat-label">Price Ranges</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">{priceSummary.totalProducts}</div>
                                        <div className="summary-stat-label">Products</div>
                                    </div>
                                    <div className="summary-stat">
                                        <div className="summary-stat-value">
                                            ${Math.round(priceSummary.grandTotal || 0).toLocaleString()}
                                        </div>
                                        <div className="summary-stat-label">Total Value</div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
