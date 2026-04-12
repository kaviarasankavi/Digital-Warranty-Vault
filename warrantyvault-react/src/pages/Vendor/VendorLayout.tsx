import { Suspense, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShieldCheck,
    BarChart3,
    Settings,
    LogOut,
    Store,
    ChevronRight,
    Bell,
    Tag,
    ClipboardList,
    MessageSquare,
    User,
    BadgeCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { verificationApi } from '../../api/verificationApi';
import './VendorLayout.css';

const navItems = [
    { path: '/vendor/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/vendor/products',   icon: Package,         label: 'My Products' },
    { path: '/vendor/warranties', icon: ShieldCheck,     label: 'Warranties' },
    { path: '/vendor/orders',     icon: ClipboardList,   label: 'Orders' },
    { path: '/vendor/catalog',    icon: Tag,             label: 'Catalog' },
    { path: '/vendor/verify',     icon: BadgeCheck,      label: 'Verify Requests', badge: true },
    { path: '/vendor/analytics',  icon: BarChart3,       label: 'Analytics' },
    { path: '/vendor/support',    icon: MessageSquare,   label: 'Support' },
    { path: '/vendor/settings',   icon: Settings,        label: 'Settings' },
];

function PageLoader() {
    return (
        <div className="vd-page-loader">
            <div className="vd-loader-ring" />
        </div>
    );
}

export default function VendorLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const [notifOpen,     setNotifOpen]     = useState(false);
    const [pendingCount,  setPendingCount]  = useState(0);

    // Poll pending verification count every 30 s
    useEffect(() => {
        const fetch = () =>
            verificationApi.getVendorPendingCount()
                .then(n => setPendingCount(n))
                .catch(() => {});
        fetch();
        const id = setInterval(fetch, 30000);
        return () => clearInterval(id);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="vd-layout">
            {/* ── Sidebar ── */}
            <aside className="vd-sidebar">
                <div className="vd-sidebar-top">
                    {/* Brand */}
                    <div className="vd-sidebar-brand">
                        <div className="vd-brand-icon">
                            <Store size={18} />
                        </div>
                        <div>
                            <span className="vd-brand-title">WarrantyVault</span>
                            <span className="vd-brand-sub">Vendor Portal</span>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="vd-nav">
                        {navItems.map(({ path, icon: Icon, label, badge }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className={({ isActive }) =>
                                    `vd-nav-item ${isActive ? 'vd-nav-active' : ''}`
                                }
                            >
                                <Icon size={17} className="vd-nav-icon" />
                                <span>{label}</span>
                                {badge && pendingCount > 0 && (
                                    <span className="vd-nav-badge">{pendingCount}</span>
                                )}
                                <ChevronRight size={13} className="vd-nav-arrow" />
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Mini Stats */}
                <div className="vd-sidebar-stats">
                    <div className="vd-stat-title">Store Health</div>
                    <div className="vd-stat-row">
                        <span className="vd-stat-dot teal" />
                        <span className="vd-stat-label">Active Listings</span>
                        <span className="vd-stat-val">—</span>
                    </div>
                    <div className="vd-stat-row">
                        <span className="vd-stat-dot amber" />
                        <span className="vd-stat-label">Pending Claims</span>
                        <span className="vd-stat-val">—</span>
                    </div>
                    <div className="vd-stat-row">
                        <span className="vd-stat-dot coral" />
                        <span className="vd-stat-label">Expiring Soon</span>
                        <span className="vd-stat-val">—</span>
                    </div>
                </div>

                {/* Profile */}
                <div className="vd-sidebar-user">
                    <div className="vd-user-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() ?? 'V'}
                    </div>
                    <div className="vd-user-info">
                        <span className="vd-user-name">{user?.name ?? 'Vendor'}</span>
                        <span className="vd-user-role">Vendor</span>
                    </div>
                    <button className="vd-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={15} />
                    </button>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="vd-main">
                {/* Top Bar */}
                <header className="vd-topbar">
                    <div className="vd-topbar-left">
                        <div className="vd-breadcrumb">
                            <Store size={13} />
                            <span>Vendor</span>
                        </div>
                    </div>

                    <div className="vd-topbar-right">
                        <div className="vd-topbar-greeting">
                            Welcome back, <strong>{user?.name?.split(' ')[0] ?? 'Vendor'}</strong>
                        </div>

                        <button
                            className="vd-notif-btn"
                            onClick={() => setNotifOpen(!notifOpen)}
                            title="Notifications"
                        >
                            <Bell size={16} />
                            <span className="vd-notif-dot" />
                        </button>

                        <a href="/dashboard" className="vd-switch-btn" target="_blank" rel="noreferrer">
                            <User size={13} />
                            User View ↗
                        </a>
                    </div>
                </header>

                {/* Page Content */}
                <div className="vd-page-content">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
