import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Archive,
    ClipboardCheck,
    BarChart3,
    Settings,
    Shield,
    MoreVertical,
    LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import './Sidebar.css';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/products', icon: Archive, label: 'My Vault' },
    { path: '/warranties', icon: ClipboardCheck, label: 'Claims', badge: 2 },
    { path: '/verify', icon: BarChart3, label: 'Reports' },
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
        <aside className="sidebar dark-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        <Shield size={20} />
                    </div>
                    <span className="logo-text">WarrantyVault</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                className={({ isActive }) =>
                                    `nav-item ${isActive ? 'active' : ''}`
                                }
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className="nav-badge">{item.badge}</span>
                                )}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="sidebar-footer">
                {user && (
                    <div className="user-info">
                        <div className="user-avatar">
                            {user.avatar ? (
                                <img src={user.avatar} alt={user.name} />
                            ) : (
                                <span>{user.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="user-details">
                            <span className="user-name">{user.name}</span>
                            <span className="user-role">Premium Member</span>
                        </div>
                        <button className="user-menu-btn" aria-label="User menu">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                )}
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
