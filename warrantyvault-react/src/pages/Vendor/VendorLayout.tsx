import { Suspense, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    Settings,
    LogOut,
    Store,
    ChevronRight,
    Bell,
    User,
    BadgeCheck,
    CalendarPlus,
    Wrench,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { verificationApi } from '../../api/verificationApi';
import { warrantyExtensionApi } from '../../api/warrantyExtensionApi';
import { warrantyClaimApi } from '../../api/warrantyClaimApi';
import './VendorLayout.css';

const navItems = [
    { path: '/vendor/verify',      icon: BadgeCheck,   label: 'Verify Requests', badge: 'verify'    },
    { path: '/vendor/extensions',  icon: CalendarPlus, label: 'Extensions',      badge: 'extension' },
    { path: '/vendor/claims',      icon: Wrench,       label: 'Repair Claims',   badge: 'claims'    },
    { path: '/vendor/settings',    icon: Settings,     label: 'Settings'                            },
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
    const [notifOpen,        setNotifOpen]        = useState(false);
    const [pendingCount,     setPendingCount]     = useState(0);
    const [extPendingCount,  setExtPendingCount]  = useState(0);
    const [claimCount,       setClaimCount]       = useState(0);

    // Poll pending counts every 30 s
    useEffect(() => {
        const fetchCounts = () => {
            verificationApi.getVendorPendingCount()
                .then(n => setPendingCount(n)).catch(() => {});
            warrantyExtensionApi.getVendorPendingCount()
                .then(n => setExtPendingCount(n)).catch(() => {});
            warrantyClaimApi.getVendorCount()
                .then(n => setClaimCount(n)).catch(() => {});
        };
        fetchCounts();
        const id = setInterval(fetchCounts, 30000);
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
                        {navItems.map(({ path, icon: Icon, label, badge }) => {
                            const badgeCount =
                                badge === 'verify'    ? pendingCount :
                                badge === 'extension' ? extPendingCount :
                                badge === 'claims'    ? claimCount : 0;
                            return (
                                <NavLink
                                    key={path}
                                    to={path}
                                    className={({ isActive }) =>
                                        `vd-nav-item ${isActive ? 'vd-nav-active' : ''}`
                                    }
                                >
                                    <Icon size={17} className="vd-nav-icon" />
                                    <span>{label}</span>
                                    {badgeCount > 0 && (
                                        <span className="vd-nav-badge">{badgeCount}</span>
                                    )}
                                    <ChevronRight size={13} className="vd-nav-arrow" />
                                </NavLink>
                            );
                        })}
                    </nav>
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
