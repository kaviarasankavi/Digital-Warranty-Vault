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
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import './Dashboard.css';

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
        timeIcon: 'clock',
    },
    {
        id: '2',
        product: 'Sony WH-1000XM5',
        image: '🎧',
        status: 'Approved',
        statusType: 'success',
        subtitle: 'Accidental Damage Claim',
        time: 'Resolved yesterday',
        timeIcon: 'check',
    },
    {
        id: '3',
        product: 'DJI Mini 3 Pro',
        image: '🚁',
        status: 'New',
        statusType: 'info',
        subtitle: 'Standard Warranty Registered',
        time: 'Added 2 hrs ago',
        timeIcon: 'clock',
    },
];

export default function Dashboard() {
    const [animatedCount, setAnimatedCount] = useState(0);
    const maxBarValue = Math.max(...mockBarData.map((d) => d.value));

    useEffect(() => {
        const duration = 1200;
        const steps = 50;
        const stepDuration = duration / steps;
        const target = 24;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedCount(Math.floor(target * eased));

            if (step >= steps) clearInterval(interval);
        }, stepDuration);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="dashboard dark-dashboard">
            <Header title="Dashboard Overview" />

            <div className="dashboard-content">
                {/* Top Row: Stats + Chart + Quick Actions */}
                <div className="dash-top-grid">
                    {/* Active Warranties Card */}
                    <div className="dash-card stat-active-card">
                        <div className="stat-card-header">
                            <div className="stat-icon-circle green">
                                <CheckCircle size={18} />
                            </div>
                            <div className="stat-trend-badge">
                                <TrendingUp size={12} />
                                <span>+12%</span>
                            </div>
                        </div>
                        <div className="stat-big-number">{animatedCount}</div>
                        <div className="stat-big-label">Active Warranties</div>
                        <div className="stat-progress-bar">
                            <div className="stat-progress-fill" style={{ width: '75%' }} />
                        </div>
                    </div>

                    {/* Coverage Timeline Chart */}
                    <div className="dash-card chart-card">
                        <div className="chart-header">
                            <div>
                                <h3 className="chart-title">Coverage Timeline</h3>
                                <p className="chart-subtitle">Asset protection value over time</p>
                            </div>
                            <button className="chart-filter-btn">
                                This Year
                                <ChevronDown size={14} />
                            </button>
                        </div>
                        <div className="bar-chart">
                            {mockBarData.map((bar, index) => (
                                <div key={bar.month} className="bar-column">
                                    <div className="bar-wrapper">
                                        {index === 5 && (
                                            <div className="bar-tooltip">
                                                ${bar.value.toLocaleString()}
                                            </div>
                                        )}
                                        <div
                                            className={`bar ${index === 5 ? 'bar-highlight' : ''}`}
                                            style={{
                                                height: `${(bar.value / maxBarValue) * 100}%`,
                                            }}
                                        />
                                    </div>
                                    <span className="bar-label">{bar.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="dash-quick-actions">
                        <button className="quick-action-btn">
                            <div className="qa-icon">
                                <Plus size={20} />
                            </div>
                            <span>Add Product</span>
                        </button>
                        <button className="quick-action-btn">
                            <div className="qa-icon warning">
                                <AlertTriangle size={20} />
                            </div>
                            <span>File Claim</span>
                        </button>
                        <button className="quick-action-btn">
                            <div className="qa-icon accent">
                                <FileText size={20} />
                            </div>
                            <span>Export PDF</span>
                        </button>
                        <button className="quick-action-btn">
                            <div className="qa-icon support">
                                <Headphones size={20} />
                            </div>
                            <span>Support</span>
                        </button>
                    </div>
                </div>

                {/* Expiring Soon Card */}
                <div className="dash-card expiring-card">
                    <div className="expiring-header">
                        <div className="expiring-icon">
                            <AlertTriangle size={20} />
                        </div>
                        <div className="expiring-info">
                            <span className="expiring-label">Upcoming</span>
                            <div className="expiring-count">3</div>
                            <div className="expiring-text">Expiring Soon</div>
                        </div>
                    </div>
                    <div className="expiring-avatars">
                        <div className="avatar-stack-mini">
                            <span className="mini-avatar" style={{ background: '#6366f1' }}>📱</span>
                            <span className="mini-avatar" style={{ background: '#f59e0b' }}>⌚</span>
                            <span className="mini-avatar" style={{ background: '#10b981' }}>🖥️</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="recent-activity-section">
                    <div className="section-header">
                        <h3 className="section-title-text">Recent Activity</h3>
                        <button className="view-all-link">
                            View All
                            <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="activity-cards-row">
                        {mockRecentActivity.map((item) => (
                            <div key={item.id} className="activity-card">
                                <div className="activity-card-image">
                                    <span className="activity-emoji">{item.image}</span>
                                </div>
                                <div className="activity-card-content">
                                    <div className="activity-card-top">
                                        <span className="activity-card-name">{item.product}</span>
                                        <span className={`activity-status-badge ${item.statusType}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="activity-card-subtitle">{item.subtitle}</p>
                                    <div className="activity-card-time">
                                        <Clock size={12} />
                                        <span>{item.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Value Protected */}
                <div className="dash-card total-value-card">
                    <div className="total-value-left">
                        <div className="total-value-icon">
                            <Lock size={22} />
                        </div>
                        <div>
                            <h3 className="total-value-title">Total Value Protected</h3>
                            <p className="total-value-subtitle">
                                Across 24 registered devices and appliances.
                            </p>
                        </div>
                    </div>
                    <div className="total-value-amount">$34,250.00</div>
                </div>
            </div>
        </div>
    );
}
