import { useState } from 'react';

import {
    Shield,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus,
    ChevronDown,
    ArrowUpRight,
    FileText,
    Zap,
    Filter,
    ChevronRight,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import '../../styles/userDashboard.css';
import './Warranties.css';

type WarrantyStatus = 'active' | 'expiring' | 'expired' | 'claimed';

const filterTabs = ['All Records', 'Active', 'Expiring Soon', 'Expired', 'Claimed'];

const statusConfig: Record<WarrantyStatus, { label: string; class: string; icon: any }> = {
    active: { label: 'Active', class: 'status-active', icon: CheckCircle },
    expiring: { label: 'Expiring', class: 'status-expiring', icon: Clock },
    expired: { label: 'Expired', class: 'status-expired', icon: AlertTriangle },
    claimed: { label: 'Claimed', class: 'status-claimed', icon: Shield },
};

const typeConfig: Record<string, { label: string; class: string }> = {
    standard: { label: 'Standard', class: 'type-standard' },
    extended: { label: 'Extended', class: 'type-extended' },
    premium: { label: 'Premium', class: 'type-premium' },
};

export default function Warranties() {
    const warranties = useDataStore((s) => s.warranties);
    const [activeFilter, setActiveFilter] = useState('All Records');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const stats = {
        total: warranties.length,
        active: warranties.filter((w) => w.status === 'active').length,
        expiring: warranties.filter((w) => w.status === 'expiring').length,
        expired: warranties.filter((w) => w.status === 'expired').length,
    };

    const filteredWarranties = activeFilter === 'All Records'
        ? warranties
        : warranties.filter((w) => {
            if (activeFilter === 'Active') return w.status === 'active';
            if (activeFilter === 'Expiring Soon') return w.status === 'expiring';
            if (activeFilter === 'Expired') return w.status === 'expired';
            if (activeFilter === 'Claimed') return w.status === 'claimed';
            return true;
        });

    return (
        <div className="user-dashboard-main">


            <div className="user-dashboard-content">
                {/* Stats Row */}
                <div className="warranty-stats-grid user-animate-in user-animate-in-1">
                    <div className="warranty-stat-card">
                        <div className="warranty-stat-icon" style={{ background: 'rgba(80, 70, 229, 0.1)', color: '#5046e5' }}>
                            <Shield size={22} />
                        </div>
                        <div className="warranty-stat-info">
                            <span className="warranty-stat-value">{stats.total}</span>
                            <span className="warranty-stat-label">Total Warranties</span>
                        </div>
                    </div>
                    <div className="warranty-stat-card">
                        <div className="warranty-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <CheckCircle size={22} />
                        </div>
                        <div className="warranty-stat-info">
                            <span className="warranty-stat-value">{stats.active}</span>
                            <span className="warranty-stat-label">Active</span>
                        </div>
                    </div>
                    <div className="warranty-stat-card">
                        <div className="warranty-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <AlertTriangle size={22} />
                        </div>
                        <div className="warranty-stat-info">
                            <span className="warranty-stat-value">{stats.expiring}</span>
                            <span className="warranty-stat-label">Expiring Soon</span>
                        </div>
                    </div>
                    <div className="warranty-stat-card">
                        <div className="warranty-stat-icon" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
                            <Clock size={22} />
                        </div>
                        <div className="warranty-stat-info">
                            <span className="warranty-stat-value">{stats.expired}</span>
                            <span className="warranty-stat-label">Expired</span>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs + Actions */}
                <div className="warranty-toolbar user-animate-in user-animate-in-2">
                    <div className="warranty-filter-tabs">
                        {filterTabs.map((tab) => (
                            <button
                                key={tab}
                                className={`warranty-filter-tab ${activeFilter === tab ? 'active' : ''}`}
                                onClick={() => setActiveFilter(tab)}
                            >
                                {tab}
                                {activeFilter === tab && <span className="tab-indicator" />}
                            </button>
                        ))}
                    </div>
                    <div className="warranty-toolbar-actions">
                        <button className="warranty-filter-btn">
                            <Filter size={16} />
                            <span>Filter</span>
                            <ChevronDown size={14} />
                        </button>
                        <button className="warranty-add-btn">
                            <Plus size={16} />
                            <span>New Warranty</span>
                        </button>
                    </div>
                </div>

                {/* Warranty Cards */}
                <div className="warranty-list">
                    {filteredWarranties.map((warranty, index) => {
                        const isExpanded = expandedId === warranty.id;
                        const statusInfo = statusConfig[warranty.status];
                        const typeInfo = typeConfig[warranty.type as string] ?? { label: warranty.type, class: 'type-standard' };
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={warranty.id}
                                className={`warranty-card user-animate-in ${warranty.status === 'expiring' ? 'warranty-card-urgent' : ''} ${isExpanded ? 'expanded' : ''}`}
                                style={{ animationDelay: `${0.15 + index * 0.05}s`, opacity: 0 }}
                                onClick={() => setExpandedId(isExpanded ? null : warranty.id)}
                            >
                                <div className="warranty-card-main">
                                    {/* Left: Product Info */}
                                    <div className="warranty-product-section">
                                        <div className="warranty-product-avatar">
                                            🛡️
                                        </div>
                                        <div className="warranty-product-details">
                                            <h3 className="warranty-product-name">{warranty.productName}</h3>
                                            <p className="warranty-vendor-name">{warranty.vendorName}</p>
                                            <span className="warranty-serial-number">{warranty.serialId}</span>
                                        </div>
                                    </div>

                                    {/* Center: Dates */}
                                    <div className="warranty-dates-section">
                                        <div className="warranty-date-block">
                                            <span className="warranty-date-label">Start Date</span>
                                            <span className="warranty-date-value">{warranty.startDate}</span>
                                        </div>
                                        <div className="warranty-date-arrow">
                                            <ChevronRight size={16} />
                                        </div>
                                        <div className="warranty-date-block">
                                            <span className="warranty-date-label">End Date</span>
                                            <span className="warranty-date-value">{warranty.endDate}</span>
                                        </div>
                                    </div>

                                    {/* Right: Status + Type + Actions */}
                                    <div className="warranty-status-section">
                                        {warranty.daysLeft !== undefined && (
                                            <div className={`warranty-days-badge ${warranty.status === 'expiring' ? 'urgent' : ''}`}>
                                                <Zap size={12} />
                                                <span>{warranty.daysLeft}d left</span>
                                            </div>
                                        )}
                                        <span className={`warranty-type-badge ${typeInfo.class}`}>
                                            {typeInfo.label}
                                        </span>
                                        <span className={`warranty-status-badge ${statusInfo.class}`}>
                                            <StatusIcon size={12} />
                                            {statusInfo.label}
                                        </span>
                                        <button
                                            className="warranty-action-btn"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="warranty-card-expanded">
                                        <div className="warranty-expanded-divider" />
                                        <div className="warranty-expanded-content">
                                            <div className="warranty-expanded-grid">
                                                <div className="warranty-expanded-item">
                                                    <span className="warranty-expanded-label">Warranty ID</span>
                                                    <span className="warranty-expanded-value mono">{warranty.id}</span>
                                                </div>
                                                <div className="warranty-expanded-item">
                                                    <span className="warranty-expanded-label">Coverage</span>
                                                    <span className="warranty-expanded-value">{warranty.coverageDetails}</span>
                                                </div>
                                                <div className="warranty-expanded-item">
                                                    <span className="warranty-expanded-label">Type</span>
                                                    <span className="warranty-expanded-value">{warranty.type.charAt(0).toUpperCase() + warranty.type.slice(1)} Warranty</span>
                                                </div>
                                            </div>
                                            <div className="warranty-expanded-actions">
                                                <button className="warranty-expanded-btn secondary">
                                                    <FileText size={14} />
                                                    View Certificate
                                                </button>
                                                {warranty.status === 'active' && (
                                                    <button className="warranty-expanded-btn primary">
                                                        <AlertTriangle size={14} />
                                                        File Claim
                                                    </button>
                                                )}
                                                {warranty.status === 'expiring' && (
                                                    <button className="warranty-expanded-btn warning">
                                                        <Shield size={14} />
                                                        Renew Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <div className="warranty-pagination user-animate-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
                    <span className="warranty-pagination-info">
                        Showing {filteredWarranties.length} of {warranties.length} records
                    </span>
                    <div className="warranty-pagination-controls">
                        <button className="warranty-page-btn">1</button>
                        <button className="warranty-page-btn active">2</button>
                        <button className="warranty-page-btn">3</button>
                        <span className="warranty-page-ellipsis">...</span>
                        <button className="warranty-page-btn">8</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
