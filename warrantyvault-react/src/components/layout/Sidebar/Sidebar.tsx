import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Archive,
    ShieldCheck,
    ScanLine,
    BarChart3,
    Users,
    Settings,
    Shield,
    LogOut,
    Sparkles,
    Bell,
    ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import '../../../styles/userDashboard.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Archive, label: 'My Vault' },
    { path: '/warranties', icon: ShieldCheck, label: 'Warranties', badge: 3 },
    { path: '/verify', icon: ScanLine, label: 'Verify' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/owners', icon: Users, label: 'Ownership' },
    { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside className="user-sidebar">
            {/* Logo Header */}
            <div className="user-sidebar-header">
                <div className="user-sidebar-logo">
                    <div className="user-logo-icon">
                        <Shield size={20} />
                    </div>
                    <div>
                        <span className="user-logo-text">WarrantyVault</span>
                    </div>
                </div>
            </div>

            {/* User Profile Card */}
            {user && (
                <div className="user-sidebar-profile">
                    <div className="user-profile-info">
                        <div className="user-profile-avatar">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <span>{user.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div className="user-profile-details">
                            <span className="user-profile-name">{user.name}</span>
                            <span className="user-profile-tier">
                                <Sparkles />
                                Premium Member
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="user-sidebar-nav">
                <div className="user-nav-section">
                    <span className="user-nav-label">Main Menu</span>
                    <ul className="user-nav-list">
                        {navItems.slice(0, 5).map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `user-nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon size={18} className="user-nav-icon" />
                                    <span>{item.label}</span>
                                    {item.badge && (
                                        <span className="user-nav-badge">{item.badge}</span>
                                    )}
                                    <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="user-nav-section">
                    <span className="user-nav-label">Account</span>
                    <ul className="user-nav-list">
                        {navItems.slice(5).map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `user-nav-item ${isActive ? 'active' : ''}`
                                    }
                                >
                                    <item.icon size={18} className="user-nav-icon" />
                                    <span>{item.label}</span>
                                    <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Quick Stats Card */}
                <div className="user-nav-section" style={{ marginTop: 'auto' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #5046e5 0%, #3730a3 100%)',
                        borderRadius: '12px',
                        padding: '1rem',
                        color: 'white',
                        margin: '0.5rem',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <Bell size={16} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Vault Status</span>
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>24</div>
                        <div style={{ fontSize: '0.6875rem', opacity: 0.8 }}>Items Protected</div>
                        <div style={{ 
                            height: '4px', 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: '2px', 
                            marginTop: '0.75rem',
                            overflow: 'hidden'
                        }}>
                            <div style={{ 
                                width: '75%', 
                                height: '100%', 
                                background: 'white',
                                borderRadius: '2px'
                            }} />
                        </div>
                        <div style={{ fontSize: '0.625rem', opacity: 0.6, marginTop: '0.375rem' }}>75% vault capacity</div>
                    </div>
                </div>
            </nav>

            {/* Footer */}
            <div className="user-sidebar-footer">
                <button className="user-logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
