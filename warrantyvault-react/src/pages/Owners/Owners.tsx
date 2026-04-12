import { useState } from 'react';

import {
    UserCheck,
    UserX,
    Clock,
    ArrowUpRight,
    Plus,
    Search,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import './Owners.css';

type OwnerStatus = 'verified' | 'pending' | 'suspended';

const filterTabs = ['All Records', 'Verified', 'Pending Verification', 'Tier 1 Collectors'];

const statusConfig: Record<OwnerStatus, { label: string; class: string; icon: React.ReactNode }> = {
    verified: { label: 'Verified', class: 'owner-status-verified', icon: <UserCheck size={11} /> },
    pending: { label: 'Pending', class: 'owner-status-pending', icon: <Clock size={11} /> },
    suspended: { label: 'Suspended', class: 'owner-status-suspended', icon: <UserX size={11} /> },
};

export default function Owners() {
    const owners = useDataStore((s) => s.owners);
    const [activeFilter, setActiveFilter] = useState('All Records');
    const [searchQuery, setSearchQuery] = useState('');

    const totalVerified = owners.filter((o) => o.status === 'verified').length;
    const totalPending = owners.filter((o) => o.status === 'pending').length;

    const filtered = owners.filter((owner) => {
        const matchesFilter =
            activeFilter === 'All Records' ||
            (activeFilter === 'Verified' && owner.status === 'verified') ||
            (activeFilter === 'Pending Verification' && owner.status === 'pending') ||
            (activeFilter === 'Tier 1 Collectors' && owner.assetsCount >= 10);
        const matchesSearch =
            !searchQuery ||
            owner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            owner.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="owners-page">


            <div className="owners-content">
                {/* Page Header with Stats */}
                <div className="owners-page-header">
                    <div className="owners-title-block">
                        <div className="owners-title-row">
                            <h1 className="owners-title">Registered Owners</h1>
                            <span className="owners-count-badge">{owners.length}</span>
                        </div>
                        <p className="owners-subtitle">
                            A curated collection of verified asset custodians. Each entry represents a formal link between physical integrity and digital provenance.
                        </p>
                    </div>

                    <div className="owners-header-actions">
                        <div className="owners-search-wrap">
                            <Search size={15} className="owners-search-icon" />
                            <input
                                type="text"
                                placeholder="Search archives..."
                                className="owners-search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="owners-new-btn">
                            <Plus size={16} />
                            <span>New Entry</span>
                        </button>
                    </div>
                </div>

                {/* Mini stats */}
                <div className="owners-mini-stats">
                    <div className="owners-mini-stat">
                        <UserCheck size={16} className="mini-stat-icon green" />
                        <span className="mini-stat-value">{totalVerified}</span>
                        <span className="mini-stat-label">Verified</span>
                    </div>
                    <div className="owners-mini-stat-divider" />
                    <div className="owners-mini-stat">
                        <Clock size={16} className="mini-stat-icon amber" />
                        <span className="mini-stat-value">{totalPending}</span>
                        <span className="mini-stat-label">Pending</span>
                    </div>
                    <div className="owners-mini-stat-divider" />
                    <div className="owners-mini-stat">
                        <UserCheck size={16} className="mini-stat-icon indigo" />
                        <span className="mini-stat-value">{owners.filter((o) => o.assetsCount >= 10).length}</span>
                        <span className="mini-stat-label">Tier 1</span>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="owners-filter-row">
                    {filterTabs.map((tab) => (
                        <button
                            key={tab}
                            className={`owners-filter-tab ${activeFilter === tab ? 'owners-filter-active' : ''}`}
                            onClick={() => setActiveFilter(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                    <div className="owners-filter-sort">
                        <span>Filter by Acquisition Date</span>
                        <ArrowUpRight size={14} />
                    </div>
                </div>

                {/* Owner Entries */}
                <div className="owners-list">
                    {filtered.map((owner, index) => {
                        const statusInfo = statusConfig[owner.status];
                        const isAltRow = index % 2 === 1;

                        return (
                            <div
                                key={owner.id}
                                className={`owner-entry ${isAltRow ? 'owner-entry-alt' : ''} ${owner.status === 'suspended' ? 'owner-entry-suspended' : ''}`}
                            >
                                {/* Avatar */}
                                <div className={`owner-avatar ${owner.colorClass}`}>
                                    {owner.initials}
                                </div>

                                {/* Info */}
                                <div className="owner-info">
                                    <div className="owner-name-row">
                                        <h3 className="owner-name">{owner.name}</h3>
                                        <span className={`owner-status-badge ${statusInfo.class}`}>
                                            {statusInfo.icon}
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <p className="owner-id-mono">{owner.id}</p>
                                    <p className="owner-desc">{owner.description}</p>
                                </div>

                                {/* Right Metadata */}
                                <div className="owner-right-meta">
                                    <div className="owner-stat-pair">
                                        <span className="owner-stat-label">Assets</span>
                                        <span className="owner-stat-value">{owner.assetsCount}</span>
                                    </div>
                                    <div className="owner-stat-pair">
                                        <span className="owner-stat-label">Last Activity</span>
                                        <span className="owner-stat-value mono">{owner.lastActivity}</span>
                                    </div>
                                    <div className="owner-entry-actions">
                                        <button className="owner-action-btn-primary">
                                            View Profile <ArrowUpRight size={13} />
                                        </button>
                                        {owner.status === 'pending' ? (
                                            <button className="owner-action-btn-alert">
                                                Complete Review
                                            </button>
                                        ) : (
                                            <button className="owner-action-btn-secondary">
                                                Edit Archives
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                <div className="owners-pagination">
                    <div className="pagination-nav-btns">
                        <button className="pag-arrow">
                            <ChevronLeft size={18} />
                        </button>
                        <button className="pag-arrow">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <div className="pagination-pages">
                        <span className="pag-page pag-page-active">01</span>
                        <span className="pag-page">02</span>
                        <span className="pag-page">03</span>
                        <span className="pag-page">04</span>
                        <span className="pag-ellipsis">...</span>
                        <span className="pag-page">12</span>
                    </div>
                    <p className="pagination-info">
                        Showing {filtered.length} of {owners.length} records
                    </p>
                </div>

                {/* Live Registry Stream indicator */}
                <div className="live-registry-indicator">
                    <div className="live-dot" />
                    <span>Live Registry Stream</span>
                </div>
            </div>
        </div>
    );
}
