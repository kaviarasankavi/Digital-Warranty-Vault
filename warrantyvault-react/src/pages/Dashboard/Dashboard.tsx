import { useState, useEffect } from 'react';
import {
    CheckCircle,
    AlertTriangle,
    Plus,
    FileText,
    Headphones,
    TrendingUp,
    Clock,
    ChevronDown,
    Lock,
    ArrowRight,
    Shield,
    Zap,
    Calendar,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import '../../styles/userDashboard.css';

// Mock data
const mockBarData = [
    { month: 'JAN', value: 1200 },
    { month: 'FEB', value: 1800 },
    { month: 'MAR', value: 2400 },
    { month: 'APR', value: 2800 },
    { month: 'MAY', value: 3200 },
    { month: 'JUN', value: 4100 },
    { month: 'JUL', value: 3600 },
    { month: 'AUG', value: 2200 },
];

const mockRecentActivity = [
    {
        id: '1',
        product: 'MacBook Pro M2',
        image: '💻',
        status: 'Expiring',
        statusType: 'warning',
        subtitle: 'Apple Care+ • Serial #A123...',
        time: '30 days left',
    },
    {
        id: '2',
        product: 'Sony WH-1000XM5',
        image: '🎧',
        status: 'Approved',
        statusType: 'success',
        subtitle: 'Accidental Damage Claim',
        time: 'Resolved yesterday',
    },
    {
        id: '3',
        product: 'DJI Mini 3 Pro',
        image: '🚁',
        status: 'New',
        statusType: 'info',
        subtitle: 'Standard Warranty Registered',
        time: 'Added 2 hrs ago',
    },
];

export default function Dashboard() {
    const [animatedCount, setAnimatedCount] = useState(0);
    const [animatedValue, setAnimatedValue] = useState(0);
    const maxBarValue = Math.max(...mockBarData.map((d) => d.value));

    useEffect(() => {
        // Animate warranty count
        const countDuration = 1200;
        const countSteps = 50;
        const countStepDuration = countDuration / countSteps;
        const countTarget = 24;
        let countStep = 0;

        const countInterval = setInterval(() => {
            countStep++;
            const progress = countStep / countSteps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedCount(Math.floor(countTarget * eased));
            if (countStep >= countSteps) clearInterval(countInterval);
        }, countStepDuration);

        // Animate value
        const valueDuration = 1500;
        const valueSteps = 60;
        const valueStepDuration = valueDuration / valueSteps;
        const valueTarget = 34250;
        let valueStep = 0;

        const valueInterval = setInterval(() => {
            valueStep++;
            const progress = valueStep / valueSteps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedValue(Math.floor(valueTarget * eased));
            if (valueStep >= valueSteps) clearInterval(valueInterval);
        }, valueStepDuration);

        return () => {
            clearInterval(countInterval);
            clearInterval(valueInterval);
        };
    }, []);

    return (
        <div className="user-dashboard-main">
            <Header title="Dashboard" subtitle="Overview" />

            <div className="user-dashboard-content">
                {/* Bento Grid */}
                <div className="user-bento-grid">
                    {/* Active Warranties - Large Card */}
                    <div className="user-bento-card card-medium card-primary user-animate-in user-animate-in-1">
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                    <Shield size={22} />
                                </div>
                                <div className="user-stat-trend trend-up" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
                                    <TrendingUp size={12} />
                                    <span>+12%</span>
                                </div>
                            </div>
                            <div className="user-stat-value">{animatedCount}</div>
                            <div className="user-stat-label">Active Warranties</div>
                            <div className="user-stat-progress">
                                <div className="user-stat-progress-fill" style={{ width: '75%' }} />
                            </div>
                        </div>
                    </div>

                    {/* Coverage Timeline Chart */}
                    <div className="user-bento-card card-wide user-chart-card user-animate-in user-animate-in-2">
                        <div className="user-chart-header">
                            <div>
                                <h3 className="user-chart-title">Coverage Timeline</h3>
                                <p className="user-chart-subtitle">Asset protection value over time</p>
                            </div>
                            <button className="user-chart-filter">
                                This Year
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <div className="user-chart-body">
                            <div className="user-bar-chart">
                                {mockBarData.map((bar, index) => (
                                    <div key={bar.month} className="user-bar-column">
                                        <div className="user-bar-wrapper">
                                            <div className="user-bar-tooltip">
                                                ${bar.value.toLocaleString()}
                                            </div>
                                            <div
                                                className={`user-bar ${index === 5 ? 'bar-highlight' : index >= 3 && index <= 6 ? 'bar-active' : ''}`}
                                                style={{
                                                    height: `${(bar.value / maxBarValue) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="user-bar-label">{bar.month}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="user-bento-card card-medium user-animate-in user-animate-in-3">
                        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem' }}>
                            Quick Actions
                        </h3>
                        <div className="user-quick-actions">
                            <button className="user-quick-action-btn">
                                <div className="user-qa-icon icon-add">
                                    <Plus size={20} />
                                </div>
                                <span>Add Product</span>
                            </button>
                            <button className="user-quick-action-btn">
                                <div className="user-qa-icon icon-claim">
                                    <AlertTriangle size={20} />
                                </div>
                                <span>File Claim</span>
                            </button>
                            <button className="user-quick-action-btn">
                                <div className="user-qa-icon icon-export">
                                    <FileText size={20} />
                                </div>
                                <span>Export PDF</span>
                            </button>
                            <button className="user-quick-action-btn">
                                <div className="user-qa-icon icon-support">
                                    <Headphones size={20} />
                                </div>
                                <span>Support</span>
                            </button>
                        </div>
                    </div>

                    {/* Expiring Soon */}
                    <div className="user-bento-card card-medium user-expiring-card user-animate-in user-animate-in-4">
                        <div className="user-expiring-left">
                            <div className="user-expiring-icon">
                                <Calendar size={22} />
                            </div>
                            <div className="user-expiring-info">
                                <span className="user-expiring-label">Upcoming</span>
                                <div className="user-expiring-count">3</div>
                                <span className="user-expiring-text">Expiring Soon</span>
                            </div>
                        </div>
                        <div className="user-expiring-avatars">
                            <div className="user-avatar-stack">
                                <span className="user-mini-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>📱</span>
                                <span className="user-mini-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>⌚</span>
                                <span className="user-mini-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>🖥️</span>
                            </div>
                        </div>
                    </div>

                    {/* Claims Status */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-5">
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon icon-coral">
                                    <Zap size={20} />
                                </div>
                            </div>
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>2</div>
                            <div className="user-stat-label">Active Claims</div>
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
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>18</div>
                            <div className="user-stat-label">Products</div>
                        </div>
                    </div>

                    {/* Coverage Rate */}
                    <div className="user-bento-card card-small user-animate-in user-animate-in-5" style={{ animationDelay: '0.35s' }}>
                        <div className="user-stat-card">
                            <div className="user-stat-header">
                                <div className="user-stat-icon icon-amber">
                                    <TrendingUp size={20} />
                                </div>
                            </div>
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>92%</div>
                            <div className="user-stat-label">Coverage</div>
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
                            <div className="user-stat-value" style={{ fontSize: '2rem' }}>15</div>
                            <div className="user-stat-label">Verified</div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="user-activity-section user-animate-in" style={{ animationDelay: '0.45s', opacity: 0 }}>
                    <div className="user-section-header">
                        <h3 className="user-section-title">Recent Activity</h3>
                        <button className="user-view-all-btn">
                            View All
                            <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="user-activity-grid">
                        {mockRecentActivity.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="user-activity-card user-animate-in"
                                style={{ animationDelay: `${0.5 + index * 0.05}s`, opacity: 0 }}
                            >
                                <div className="user-activity-image">
                                    {item.image}
                                </div>
                                <div className="user-activity-content">
                                    <div className="user-activity-top">
                                        <span className="user-activity-name">{item.product}</span>
                                        <span className={`user-activity-badge badge-${item.statusType}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="user-activity-subtitle">{item.subtitle}</p>
                                    <div className="user-activity-time">
                                        <Clock size={12} />
                                        <span>{item.time}</span>
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
                            <h3>Total Value Protected</h3>
                            <p>Across 24 registered devices and appliances</p>
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
