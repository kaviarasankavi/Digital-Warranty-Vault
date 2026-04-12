import { useState, useEffect } from 'react';
import {
    CheckCircle,
    Plus,
    Headphones,
    TrendingUp,
    Clock,
    ChevronDown,
    Lock,
    ArrowRight,
    Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { analyticsApi, MonthlySpendingItem } from '../../api/analyticsApi';
import { productApi, Product } from '../../api/productApi';
import '../../styles/userDashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
    const [animatedCount, setAnimatedCount] = useState(0);
    const [animatedValue, setAnimatedValue] = useState(0);
    
    // Dynamic State
    const [monthlyData, setMonthlyData] = useState<MonthlySpendingItem[]>([]);
    const [monthlySummary, setMonthlySummary] = useState<any>({});
    const [categorySummary, setCategorySummary] = useState<any>({});
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const maxBarValue = Math.max(...monthlyData.map((d) => d.totalSpend), 1);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [monthlyRes, categoryRes, productsRes] = await Promise.all([
                    analyticsApi.getMonthlySpending(),
                    analyticsApi.getCategorySummary(),
                    productApi.getAll({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' })
                ]);
                
                setMonthlyData(monthlyRes.data);
                setMonthlySummary(monthlyRes.summary);
                setCategorySummary(categoryRes.summary);
                setRecentProducts(productsRes.data);
                
                // Animate counts after data is fetched
                animateStats(categoryRes.summary.totalProducts || 0, categoryRes.summary.totalSpend || 0);
            } catch (err) {
                console.error("Failed to load dashboard data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const animateStats = (targetCount: number, targetValue: number) => {
        // Animate product count
        const countDuration = 1200;
        const countSteps = 50;
        let countStep = 0;
        const countInterval = setInterval(() => {
            countStep++;
            const progress = countStep / countSteps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedCount(Math.floor(targetCount * eased));
            if (countStep >= countSteps) {
                setAnimatedCount(targetCount);
                clearInterval(countInterval);
            }
        }, countDuration / countSteps);

        // Animate value
        const valueDuration = 1500;
        const valueSteps = 60;
        let valueStep = 0;
        const valueInterval = setInterval(() => {
            valueStep++;
            const progress = valueStep / valueSteps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(Math.floor(targetValue * eased));
            if (valueStep >= valueSteps) {
                setAnimatedValue(targetValue);
                clearInterval(valueInterval);
            }
        }, valueDuration / valueSteps);
    };

    return (
        <div className="user-dashboard-main">


            <div className="user-dashboard-content">
                {/* Bento Grid */}
                <div className="user-bento-grid">
                    {/* Products - Large Card */}
                    <div className="user-bento-card card-medium card-primary user-animate-in user-animate-in-1">
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                    <Shield size={22} />
                                </div>
                                <div className="user-stat-trend trend-up" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                    <TrendingUp size={12} />
                                    <span>Active</span>
                                </div>
                            </div>
                            <div className="user-stat-value">{animatedCount}</div>
                            <div className="user-stat-label">Total Products</div>
                            <div className="user-stat-progress">
                                <div className="user-stat-progress-fill" style={{ width: '100%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Spending Timeline Chart */}
                    <div className="user-bento-card card-wide user-chart-card user-animate-in user-animate-in-2">
                        <div className="user-chart-header">
                            <div>
                                <h3 className="user-chart-title">Spending Timeline</h3>
                                <p className="user-chart-subtitle">Asset investment over time</p>
                            </div>
                            <button className="user-chart-filter">
                                This Year
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <div className="user-chart-body">
                            <div className="user-bar-chart">
                                {monthlyData.map((bar, index) => (
                                    <div key={bar.label} className="user-bar-column">
                                        <div className="user-bar-wrapper">
                                            <div className="user-bar-tooltip">
                                                ${bar.totalSpend.toLocaleString()}
                                            </div>
                                            <div
                                                className={`user-bar ${index === monthlyData.length - 1 ? 'bar-highlight' : 'bar-active'}`}
                                                style={{
                                                    height: `${(bar.totalSpend / maxBarValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="user-bar-label" style={{fontSize: '0.65rem'}}>{bar.label.split(' ')[0]}</span>
                                    </div>
                                ))}
                                {monthlyData.length === 0 && !loading && (
                                    <div style={{width: '100%', textAlign: 'center', color: '#888'}}>No data available</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-3">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                            Quick Actions
                        </h3>
                        <div className="user-quick-actions" style={{ gridTemplateColumns: '1fr' }}>
                            <button className="user-quick-action-btn" onClick={() => navigate('/products')}>
                                <div className="user-qa-icon icon-add">
                                    <Plus size={20} />
                                </div>
                                <span>Add Product</span>
                            </button>
                            <button className="user-quick-action-btn">
                                <div className="user-qa-icon icon-support">
                                    <Headphones size={20} />
                                </div>
                                <span>Support</span>
                            </button>
                        </div>
                    </div>

                    {/* Products Count */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-5" style={{ animationDelay: '0.3s' }}>
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon icon-mint">
                                    <CheckCircle size={20} />
                                </div>
                            </div>
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>{categorySummary.totalProducts || 0}</div>
                            <div className="user-stat-label">Products</div>
                        </div>
                    </div>

                    {/* Categories Stats */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-5" style={{ animationDelay: '0.35s' }}>
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon icon-amber">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>{categorySummary.totalCategories || 0}</div>
                            <div className="user-stat-label">Categories</div>
                        </div>
                    </div>

                    {/* Verified Products */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-5" style={{ animationDelay: '0.4s' }}>
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon icon-primary">
                                    <Shield size={20} />
                                </div>
                            </div>
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>{categorySummary.totalProducts || 0}</div>
                            <div className="user-stat-label">Verified</div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="user-activity-section user-animate-in" style={{ animationDelay: '0.45s', opacity: 0 }}>
                    <div className="user-section-header">
                        <h3 className="user-section-title">Recent Activity</h3>
                        <button className="user-view-all-btn" onClick={() => navigate('/products')}>
                            View All
                            <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="user-activity-grid">
                        {recentProducts.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="user-activity-card user-animate-in"
                                style={{ animationDelay: `${0.5 + index * 0.05}s`, opacity: 0 }}
                            >
                                <div className="user-activity-image">
                                    {item.category === 'Electronics' ? '📱' :
                                     item.category === 'Computing' ? '💻' :
                                     item.category === 'Audio' ? '🎧' : '📦'}
                                </div>
                                <div className="user-activity-content">
                                    <div className="user-activity-top">
                                        <span className="user-activity-name">{item.name}</span>
                                        <span className={`user-activity-badge badge-info`}>
                                            New
                                        </span>
                                    </div>
                                    <p className="user-activity-subtitle">{item.brand} • {item.model}</p>
                                    <div className="user-activity-time">
                                        <Clock size={12} />
                                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Value Protected */}
                <div className="user-bento-card card-full user-total-value-card user-animate-in" style={{ animationDelay: '0.6s', opacity: 0 }}>
                    <div className="user-total-value-left">
                        <div className="user-total-value-icon">
                            <Lock size={24} />
                        </div>
                        <div className="user-total-value-info">
                            <h3>Total Asset Value</h3>
                            <p>Across {categorySummary.totalProducts || 0} registered devices and appliances</p>
                        </div>
                    </div>
                    <div className="user-total-value-amount">
                        <span className="currency">$</span>
                        {animatedValue.toLocaleString()}
                        <span className="currency">.00</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
