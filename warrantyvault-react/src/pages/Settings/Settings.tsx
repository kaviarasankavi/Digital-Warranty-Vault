import { useState } from 'react';
import { Header } from '../../components/layout/Header';
import { useAuthStore } from '../../store/authStore';
import {
    User,
    Shield,
    Bell,
    Key,
    CreditCard,
    AlertTriangle,
    CheckCircle,
    Edit3,
    Save,
    ChevronRight,
} from 'lucide-react';
import './Settings.css';

interface ToggleOption {
    id: string;
    label: string;
    description: string;
    defaultOn: boolean;
}

const systemToggles: ToggleOption[] = [
    { id: 'biometric', label: 'Biometric Authentication', description: 'Require fingerprint for high-value access.', defaultOn: true },
    { id: 'auto_archive', label: 'Auto-Archive Protocol', description: 'Move files older than 90 days to vault.', defaultOn: false },
    { id: 'watermark', label: 'Editorial Watermarking', description: 'Embed hidden metadata into document exports.', defaultOn: true },
    { id: 'email_alerts', label: 'Warranty Expiry Alerts', description: 'Email alerts at 30-day and 7-day marks.', defaultOn: true },
];

const securityAlerts = [
    { type: 'warning', icon: <AlertTriangle size={16} />, title: 'Legacy API Detected', body: 'v2.4 endpoint is deprecated and will close in 14 days.', action: null },
    { type: 'error', icon: <AlertTriangle size={16} />, title: 'Failed Login Attempt', body: 'IP 192.168.1.45 blocked after 5 failed tries.', action: 'Review' },
    { type: 'success', icon: <CheckCircle size={16} />, title: 'Maintenance Complete', body: 'Server region EU-WEST-1 patched successfully.', action: null },
];

const settingSections = [
    { id: 'profile', icon: <User size={18} />, label: 'Profile' },
    { id: 'security', icon: <Shield size={18} />, label: 'Security' },
    { id: 'notifications', icon: <Bell size={18} />, label: 'Notifications' },
    { id: 'api', icon: <Key size={18} />, label: 'API' },
    { id: 'billing', icon: <CreditCard size={18} />, label: 'Billing' },
];

export default function Settings() {
    const { user } = useAuthStore();
    const [activeSection, setActiveSection] = useState('profile');
    const [toggleStates, setToggleStates] = useState<Record<string, boolean>>(
        Object.fromEntries(systemToggles.map((t) => [t.id, t.defaultOn]))
    );
    const [isEditing, setIsEditing] = useState(false);
    const [displayName, setDisplayName] = useState(user?.name || 'Alexander Sterling');
    const [position, setPosition] = useState('Lead Archivist');
    const [email, setEmail] = useState(user?.email || 'sterling@editorialvault.com');

    const handleToggle = (id: string) => {
        setToggleStates((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="settings-page">
            <Header title="Registry Control" />

            <div className="settings-content">
                {/* Page Header */}
                <div className="settings-page-header">
                    <h1 className="settings-main-title">
                        Account <span className="title-accent">Settings</span>
                    </h1>
                    <p className="settings-main-subtitle">
                        Manage your profile, security preferences, and subscription details. Your vault, your way.
                    </p>
                </div>

                <div className="settings-layout">
                    {/* Left Nav */}
                    <aside className="settings-sidenav">
                        <div className="sidenav-user">
                            <div className="sidenav-avatar">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <div>
                                <h3 className="sidenav-name">{user?.name || 'Vault Admin'}</h3>
                                <p className="sidenav-role">System Settings</p>
                            </div>
                        </div>

                        <nav className="sidenav-links">
                            {settingSections.map((sec) => (
                                <button
                                    key={sec.id}
                                    className={`sidenav-link ${activeSection === sec.id ? 'sidenav-link-active' : ''}`}
                                    onClick={() => setActiveSection(sec.id)}
                                >
                                    {sec.icon}
                                    <span>{sec.label}</span>
                                    <ChevronRight size={14} className="sidenav-chevron" />
                                </button>
                            ))}
                        </nav>

                        <div className="sidenav-upgrade">
                            <button className="sidenav-upgrade-btn">Upgrade Plan</button>
                        </div>
                    </aside>

                    {/* Main Settings Grid */}
                    <div className="settings-main-grid">
                        {/* Profile Card */}
                        <section className="settings-card settings-card-profile">
                            <div className="settings-card-accent-dot top-right coral" />
                            <div className="profile-card-inner">
                                <div className="profile-avatar-wrap">
                                    <div className="profile-avatar-big">
                                        {displayName.charAt(0)}
                                    </div>
                                    <button className="profile-edit-avatar" onClick={() => setIsEditing(true)}>
                                        <Edit3 size={16} />
                                    </button>
                                </div>
                                <div className="profile-fields">
                                    <div className="profile-fields-grid">
                                        <div className="profile-field">
                                            <label className="field-label">Display Name</label>
                                            <input
                                                type="text"
                                                className={`field-input ${isEditing ? 'field-input-active' : ''}`}
                                                value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                        <div className="profile-field">
                                            <label className="field-label">Position</label>
                                            <input
                                                type="text"
                                                className={`field-input ${isEditing ? 'field-input-active' : ''}`}
                                                value={position}
                                                onChange={(e) => setPosition(e.target.value)}
                                                readOnly={!isEditing}
                                            />
                                        </div>
                                    </div>
                                    <div className="profile-field">
                                        <label className="field-label">Email Interface</label>
                                        <input
                                            type="email"
                                            className={`field-input field-mono ${isEditing ? 'field-input-active' : ''}`}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            readOnly={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field-action">
                                        {isEditing ? (
                                            <button className="profile-save-btn" onClick={() => setIsEditing(false)}>
                                                <Save size={15} />
                                                Save Changes
                                            </button>
                                        ) : (
                                            <button className="profile-update-btn" onClick={() => setIsEditing(true)}>
                                                Update Identity
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Vault Status Card */}
                        <section className="settings-card settings-card-status">
                            <div className="status-card-bg-text">V.04</div>
                            <span className="status-nominal-badge">System Nominal</span>
                            <h2 className="status-card-title">Archival Integrity Verified</h2>
                            <p className="status-card-body">
                                Last global audit completed 4 minutes ago. 102.4TB remains in cold storage.
                            </p>
                            <div className="status-card-footer">
                                <span className="status-id-mono">ID: ARCH-99-01</span>
                                <Shield size={36} className="status-shield-icon" />
                            </div>
                        </section>

                        {/* System Preferences Toggles */}
                        <section className="settings-card settings-card-prefs">
                            <div className="card-section-header indigo">
                                <span className="section-accent-bar indigo-bar" />
                                <h3 className="card-section-title">System Preferences</h3>
                            </div>
                            <div className="prefs-list">
                                {systemToggles.map((toggle) => (
                                    <div key={toggle.id} className="pref-item">
                                        <div className="pref-info">
                                            <p className="pref-label">{toggle.label}</p>
                                            <p className="pref-desc">{toggle.description}</p>
                                        </div>
                                        <button
                                            className={`toggle-btn ${toggleStates[toggle.id] ? 'toggle-on' : 'toggle-off'}`}
                                            onClick={() => handleToggle(toggle.id)}
                                            aria-label={toggle.label}
                                        >
                                            <span className="toggle-knob" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Security Alerts */}
                        <section className="settings-card settings-card-security">
                            <div className="card-section-header coral">
                                <span className="section-accent-bar coral-bar" />
                                <h3 className="card-section-title">Security Alerts</h3>
                            </div>
                            <div className="security-alerts-list">
                                {securityAlerts.map((alert, i) => (
                                    <div key={i} className={`security-alert-item alert-${alert.type}`}>
                                        <span className={`alert-icon alert-icon-${alert.type}`}>{alert.icon}</span>
                                        <div className="alert-content">
                                            <p className="alert-title">{alert.title}</p>
                                            <p className="alert-body">{alert.body}</p>
                                        </div>
                                        {alert.action && (
                                            <button className="alert-action-btn">{alert.action}</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button className="audit-log-btn">
                                View Audit Log (2024-Q3)
                            </button>
                        </section>

                        {/* Subscription Section */}
                        <section className="settings-card settings-card-billing">
                            <div className="billing-gradient-bar" />
                            <div className="billing-card-inner">
                                <div className="billing-info">
                                    <span className="billing-plan-tag">Subscription Protocol</span>
                                    <h2 className="billing-plan-name">
                                        Editorial Enterprise <span className="billing-plan-sub">Edition</span>
                                    </h2>
                                    <p className="billing-plan-desc">
                                        Your current plan permits unlimited archival tiers and multi-region redundancy. Next renewal: <span className="billing-date-mono">DEC-12-2024</span>
                                    </p>
                                </div>
                                <div className="billing-price-block">
                                    <div className="billing-price">
                                        <span className="price-amount">$890</span>
                                        <span className="price-period">/year</span>
                                    </div>
                                    <div className="billing-actions">
                                        <button className="billing-btn-secondary">Billing History</button>
                                        <button className="billing-btn-primary">Manage Plan</button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
