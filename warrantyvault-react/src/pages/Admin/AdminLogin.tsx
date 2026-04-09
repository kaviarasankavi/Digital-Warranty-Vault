import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import './AdminLogin.css';

const ADMIN_CREDENTIALS = {
    email: 'admin@vault.com',
    password: 'admin123',
};

export default function AdminLogin() {
    const navigate = useNavigate();
    const { adminLogin } = useAdminAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Both fields are required.');
            return;
        }

        setIsLoading(true);
        setError(null);
        await new Promise((r) => setTimeout(r, 700));

        if (
            formData.email === ADMIN_CREDENTIALS.email &&
            formData.password === ADMIN_CREDENTIALS.password
        ) {
            adminLogin({
                id: 'admin-001',
                email: ADMIN_CREDENTIALS.email,
                name: 'System Administrator',
                role: 'superadmin',
            });
            navigate('/admin/dashboard');
        } else {
            setError('Invalid admin credentials. Access denied.');
        }
        setIsLoading(false);
    };

    return (
        <div className="admin-login-page">
            {/* Left panel */}
            <div className="admin-login-left">
                <div className="admin-login-brand">
                    <div className="admin-brand-icon">
                        <Shield size={28} />
                    </div>
                    <span className="admin-brand-name">WarrantyVault</span>
                    <span className="admin-brand-tag">System</span>
                </div>

                <div className="admin-login-hero">
                    <div className="admin-hero-label">RESTRICTED ACCESS</div>
                    <h1 className="admin-hero-title">
                        Admin<br />Control<br />Panel
                    </h1>
                    <p className="admin-hero-sub">
                        Authorized personnel only. All access attempts are logged and monitored.
                    </p>
                </div>

                <div className="admin-login-grid-bg">
                    {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className="admin-grid-cell" />
                    ))}
                </div>

                <div className="admin-login-stats">
                    <div className="admin-stat">
                        <span className="admin-stat-n">348</span>
                        <span className="admin-stat-l">Products Registered</span>
                    </div>
                    <div className="admin-stat-divider" />
                    <div className="admin-stat">
                        <span className="admin-stat-n">241</span>
                        <span className="admin-stat-l">Active Warranties</span>
                    </div>
                    <div className="admin-stat-divider" />
                    <div className="admin-stat">
                        <span className="admin-stat-n">89</span>
                        <span className="admin-stat-l">Verified Owners</span>
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="admin-login-right">
                <div className="admin-form-wrap">
                    <div className="admin-form-header">
                        <div className="admin-form-badge">
                            <Shield size={14} />
                            System Administrator Access
                        </div>
                        <h2 className="admin-form-title">Sign in to Admin</h2>
                        <p className="admin-form-sub">This portal is for system administrators only.</p>
                    </div>

                    {/* Demo hint */}
                    <div
                        className="admin-demo-hint"
                        onClick={() => {
                            setFormData({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
                            setError(null);
                        }}
                    >
                        <div className="admin-demo-dot" />
                        <div>
                            <strong>Demo admin access</strong>
                            <span>admin@vault.com · admin123</span>
                        </div>
                        <span className="admin-demo-fill">Auto-fill</span>
                    </div>

                    {error && (
                        <div className="admin-login-error">
                            <AlertTriangle size={15} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="admin-login-form">
                        <div className="admin-field">
                            <label className="admin-field-label">Admin Email</label>
                            <div className="admin-field-wrap">
                                <Mail size={16} className="admin-field-icon" />
                                <input
                                    type="email"
                                    className="admin-field-input"
                                    placeholder="vault-admin@system.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="admin-field">
                            <label className="admin-field-label">Access Password</label>
                            <div className="admin-field-wrap">
                                <Lock size={16} className="admin-field-icon" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="admin-field-input"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="admin-pw-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`admin-login-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="admin-spinner" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Shield size={16} />
                                    Access Admin Panel
                                </>
                            )}
                        </button>
                    </form>

                    <a href="/login" className="admin-user-link">
                        ← Back to user portal
                    </a>
                </div>
            </div>
        </div>
    );
}
