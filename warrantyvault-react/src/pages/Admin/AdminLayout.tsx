import { Suspense } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShieldCheck,
    Users,
    ScanLine,
    Settings,
    LogOut,
    Shield,
    ChevronRight,
    Bell,
    BarChart3,
    Megaphone,
    Newspaper,
    Activity,
    UserCircle,
} from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { useDataStore } from '../../store/dataStore';
import './AdminLayout.css';

const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/products', icon: Package, label: 'Products' },
    { path: '/admin/warranties', icon: ShieldCheck, label: 'Warranties' },
    { path: '/admin/owners', icon: Users, label: 'Owners' },
    { path: '/admin/verify', icon: ScanLine, label: 'Authenticity' },
    { path: '/admin/audit-logs', icon: Activity, label: 'Audit Logs' },
    { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { path: '/admin/news', icon: Newspaper, label: 'News Articles' },
    { path: '/admin/users',         icon: UserCircle, label: "Users' Info"   },
    { path: '/admin/analytics',     icon: BarChart3,  label: 'Analytics'     },
    { path: '/admin/settings',      icon: Settings,   label: 'Settings'      },
];

function PageLoader() {
    return (
        <div className="admin-page-loader">
            <div className="admin-loader-ring" />
        </div>
    );
}

export default function AdminLayout() {
    const navigate = useNavigate();
    const { adminUser, adminLogout } = useAdminAuthStore();
    const { products, warranties, owners } = useDataStore();

    const active = warranties.filter((w) => w.status === 'active').length;
    const expiring = warranties.filter((w) => w.status === 'expiring').length;

    const handleLogout = () => {
        adminLogout();
        navigate('/admin/login');
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-top">
                    <div className="admin-sidebar-brand">
                        <div className="admin-brand-shield">
                            <Shield size={18} />
                        </div>
                        <div>
                            <span className="admin-brand-title">WarrantyVault</span>
                            <span className="admin-brand-sub">Admin Portal</span>
                        </div>
                    </div>

                    <nav className="admin-nav">
                        {navItems.map(({ path, icon: Icon, label }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className={({ isActive }) =>
                                    `admin-nav-item ${isActive ? 'admin-nav-active' : ''}`
                                }
                            >
                                <Icon size={18} className="admin-nav-icon" />
                                <span>{label}</span>
                                <ChevronRight size={14} className="admin-nav-arrow" />
                            </NavLink>
                        ))}
                    </nav>
                </div>

                {/* Live mini-stats */}
                <div className="admin-sidebar-stats">
                    <div className="sidebar-stat-title">Live Overview</div>
                    <div className="sidebar-stat-row">
                        <span className="sidebar-stat-dot green" />
                        <span className="sidebar-stat-label">Active Warranties</span>
                        <span className="sidebar-stat-val">{active}</span>
                    </div>
                    <div className="sidebar-stat-row">
                        <span className="sidebar-stat-dot amber" />
                        <span className="sidebar-stat-label">Expiring Soon</span>
                        <span className="sidebar-stat-val">{expiring}</span>
                    </div>
                    <div className="sidebar-stat-row">
                        <span className="sidebar-stat-dot indigo" />
                        <span className="sidebar-stat-label">Products Listed</span>
                        <span className="sidebar-stat-val">{products.length}</span>
                    </div>
                    <div className="sidebar-stat-row">
                        <span className="sidebar-stat-dot coral" />
                        <span className="sidebar-stat-label">Registered Owners</span>
                        <span className="sidebar-stat-val">{owners.length}</span>
                    </div>
                </div>

                {/* User + Logout */}
                <div className="admin-sidebar-user">
                    <div className="admin-user-avatar">
                        {adminUser?.name?.charAt(0) ?? 'A'}
                    </div>
                    <div className="admin-user-info">
                        <span className="admin-user-name">{adminUser?.name ?? 'Admin'}</span>
                        <span className="admin-user-role">Super Admin</span>
                    </div>
                    <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
                        <LogOut size={16} />
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="admin-main">
                {/* Top bar */}
                <header className="admin-topbar">
                    <div className="admin-topbar-left">
                        <div className="admin-breadcrumb">
                            <Shield size={14} />
                            <span>Admin</span>
                        </div>
                    </div>
                    <div className="admin-topbar-right">
                        {expiring > 0 && (
                            <div className="admin-alert-chip">
                                <Bell size={13} />
                                {expiring} warranty expiring
                            </div>
                        )}
                        <div className="admin-topbar-stats">
                            <BarChart3 size={14} />
                            <span>{products.length} products · {owners.length} owners</span>
                        </div>
                        <a href="/dashboard" className="admin-view-site-btn" target="_blank" rel="noreferrer">
                            View Site ↗
                        </a>
                    </div>
                </header>

                {/* Page content */}
                <div className="admin-page-content">
                    <Suspense fallback={<PageLoader />}>
                        <Outlet />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
