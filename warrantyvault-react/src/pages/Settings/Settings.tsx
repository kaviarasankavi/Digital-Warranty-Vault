import { useState } from 'react';

import { useAuthStore } from '../../store/authStore';
import {
    Mail,
    Lock,
    CheckCircle,
    XCircle,
    Eye,
    EyeOff,
    Save,
    User,
} from 'lucide-react';
import './Settings.css';

const API = 'http://localhost:5001/api';

type AlertState = { type: 'success' | 'error'; message: string } | null;

/* ─── Email Update Card ─────────────────────────────────────── */
function UpdateEmailCard({ token, currentEmail, onSuccess }: {
    token: string;
    currentEmail: string;
    onSuccess: (newEmail: string) => void;
}) {
    const [email, setEmail]     = useState(currentEmail);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert]     = useState<AlertState>(null);
    const [isDirty, setIsDirty] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty || email.trim() === currentEmail) {
            setAlert({ type: 'error', message: 'New email must be different from current email.' });
            return;
        }
        setLoading(true);
        setAlert(null);
        try {
            const res = await fetch(`${API}/users/me/email`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: email.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to update email.');
            setAlert({ type: 'success', message: json.message });
            onSuccess(email.trim().toLowerCase());
            setIsDirty(false);
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="acc-card">
            <div className="acc-card-header">
                <span className="acc-card-icon email-icon"><Mail size={20} /></span>
                <div>
                    <h2 className="acc-card-title">Update Email Address</h2>
                    <p className="acc-card-sub">Change the email linked to your WarrantyVault account.</p>
                </div>
            </div>

            <form className="acc-form" onSubmit={handleSubmit} autoComplete="off">
                <div className="acc-field">
                    <label htmlFor="settings-email" className="acc-label">New Email Address</label>
                    <div className="acc-input-wrap">
                        <Mail size={16} className="acc-input-icon" />
                        <input
                            id="settings-email"
                            type="email"
                            className="acc-input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => { setEmail(e.target.value); setIsDirty(true); setAlert(null); }}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {alert && (
                    <div className={`acc-alert acc-alert-${alert.type}`}>
                        {alert.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{alert.message}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="acc-submit-btn"
                    disabled={loading || !isDirty}
                >
                    {loading ? <span className="acc-spinner" /> : <Save size={16} />}
                    {loading ? 'Saving…' : 'Save Email'}
                </button>
            </form>
        </section>
    );
}

/* ─── Password Update Card ──────────────────────────────────── */
function UpdatePasswordCard({ token }: { token: string }) {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [show, setShow] = useState({ current: false, newPwd: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert]     = useState<AlertState>(null);

    const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setAlert(null);
    };

    const strength = (() => {
        const p = form.newPassword;
        if (!p) return 0;
        let s = 0;
        if (p.length >= 6)  s++;
        if (p.length >= 10) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s; // 0-5
    })();

    const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strength] || '';
    const strengthClass = ['', 'str-1', 'str-2', 'str-3', 'str-4', 'str-5'][strength] || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmPassword) {
            setAlert({ type: 'error', message: 'New password and confirm password do not match.' });
            return;
        }
        setLoading(true);
        setAlert(null);
        try {
            const res = await fetch(`${API}/users/me/password`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Failed to update password.');
            setAlert({ type: 'success', message: json.message });
            setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            setAlert({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="acc-card">
            <div className="acc-card-header">
                <span className="acc-card-icon lock-icon"><Lock size={20} /></span>
                <div>
                    <h2 className="acc-card-title">Change Password</h2>
                    <p className="acc-card-sub">Keep your account secure with a strong, unique password.</p>
                </div>
            </div>

            <form className="acc-form" onSubmit={handleSubmit} autoComplete="off">
                {/* Current password */}
                <div className="acc-field">
                    <label htmlFor="settings-cur-pwd" className="acc-label">Current Password</label>
                    <div className="acc-input-wrap">
                        <Lock size={16} className="acc-input-icon" />
                        <input
                            id="settings-cur-pwd"
                            type={show.current ? 'text' : 'password'}
                            className="acc-input"
                            placeholder="Enter current password"
                            value={form.currentPassword}
                            onChange={handleChange('currentPassword')}
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="acc-eye-btn"
                            onClick={() => setShow(s => ({ ...s, current: !s.current }))}
                            tabIndex={-1}
                            aria-label="Toggle current password visibility"
                        >
                            {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* New password */}
                <div className="acc-field">
                    <label htmlFor="settings-new-pwd" className="acc-label">New Password</label>
                    <div className="acc-input-wrap">
                        <Lock size={16} className="acc-input-icon" />
                        <input
                            id="settings-new-pwd"
                            type={show.newPwd ? 'text' : 'password'}
                            className="acc-input"
                            placeholder="Min. 6 characters"
                            value={form.newPassword}
                            onChange={handleChange('newPassword')}
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="acc-eye-btn"
                            onClick={() => setShow(s => ({ ...s, newPwd: !s.newPwd }))}
                            tabIndex={-1}
                            aria-label="Toggle new password visibility"
                        >
                            {show.newPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {form.newPassword && (
                        <div className="pwd-strength">
                            <div className="pwd-strength-bars">
                                {[1,2,3,4,5].map(i => (
                                    <span
                                        key={i}
                                        className={`pwd-bar ${strength >= i ? strengthClass : ''}`}
                                    />
                                ))}
                            </div>
                            <span className={`pwd-strength-label ${strengthClass}`}>{strengthLabel}</span>
                        </div>
                    )}
                </div>

                {/* Confirm password */}
                <div className="acc-field">
                    <label htmlFor="settings-confirm-pwd" className="acc-label">Confirm New Password</label>
                    <div className="acc-input-wrap">
                        <Lock size={16} className="acc-input-icon" />
                        <input
                            id="settings-confirm-pwd"
                            type={show.confirm ? 'text' : 'password'}
                            className="acc-input"
                            placeholder="Repeat new password"
                            value={form.confirmPassword}
                            onChange={handleChange('confirmPassword')}
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className="acc-eye-btn"
                            onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                            tabIndex={-1}
                            aria-label="Toggle confirm password visibility"
                        >
                            {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    {form.confirmPassword && form.newPassword !== form.confirmPassword && (
                        <p className="acc-mismatch">Passwords do not match.</p>
                    )}
                </div>

                {alert && (
                    <div className={`acc-alert acc-alert-${alert.type}`}>
                        {alert.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        <span>{alert.message}</span>
                    </div>
                )}

                <button
                    type="submit"
                    className="acc-submit-btn"
                    disabled={loading}
                >
                    {loading ? <span className="acc-spinner" /> : <Save size={16} />}
                    {loading ? 'Saving…' : 'Update Password'}
                </button>
            </form>
        </section>
    );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Settings() {
    const { user, token, updateUser } = useAuthStore();

    if (!token) {
        return (
            <div className="settings-page">
            <div className="settings-content">
                <p className="acc-not-auth">You must be logged in to access settings.</p>
            </div>
        </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-content">
                {/* Page Header */}
                <div className="settings-page-header">
                    <h1 className="settings-main-title">
                        Account <span className="title-accent">Settings</span>
                    </h1>
                </div>

                {/* User Identity Banner */}
                <div className="acc-identity-banner">
                    <div className="acc-identity-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className="acc-identity-name">{user?.name || 'Vault User'}</p>
                        <p className="acc-identity-email">
                            <User size={13} style={{ display: 'inline', marginRight: 4 }} />
                            {user?.email}
                            &nbsp;·&nbsp;
                            <span className="acc-identity-role">{user?.role}</span>
                        </p>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="acc-cards-grid">
                    <UpdateEmailCard
                        token={token}
                        currentEmail={user?.email ?? ''}
                        onSuccess={(newEmail) => updateUser({ email: newEmail })}
                    />
                    <UpdatePasswordCard token={token} />
                </div>
            </div>
        </div>
    );
}
