import { useState, useEffect } from 'react';
import {
    User, Lock, Building2, Bell, Save, Eye, EyeOff,
    CheckCircle, XCircle, Loader2, ShieldCheck, Globe,
    Phone, Mail, MapPin, Hash, FileText, RefreshCw,
} from 'lucide-react';
import { vendorSettingsApi, VendorSettingsData, BusinessDetails, NotificationPrefs } from '../../api/vendorSettingsApi';
import { useAuthStore } from '../../store/authStore';
import './VendorSettings.css';

type Tab = 'profile' | 'business' | 'notifications';

interface Toast { ok: boolean; text: string }

export default function VendorSettings() {
    const { user, updateUser } = useAuthStore() as any;
    const [tab,      setTab]      = useState<Tab>('profile');
    const [settings, setSettings] = useState<VendorSettingsData | null>(null);
    const [loading,  setLoading]  = useState(true);
    const [toast,    setToast]    = useState<Toast | null>(null);

    /* ── Profile form ── */
    const [name,        setName]        = useState('');
    const [displayName, setDisplayName] = useState('');
    const [savingProf,  setSavingProf]  = useState(false);

    /* ── Password form ── */
    const [curPw,      setCurPw]      = useState('');
    const [newPw,      setNewPw]      = useState('');
    const [confPw,     setConfPw]     = useState('');
    const [showCur,    setShowCur]    = useState(false);
    const [showNew,    setShowNew]    = useState(false);
    const [showConf,   setShowConf]   = useState(false);
    const [savingPw,   setSavingPw]   = useState(false);

    /* ── Business form ── */
    const [biz,       setBiz]      = useState<BusinessDetails>({
        companyName: '', address: '', city: '', state: '', pincode: '',
        country: 'India', website: '', supportPhone: '', supportEmail: '',
        gstNumber: '', description: '',
    });
    const [savingBiz, setSavingBiz] = useState(false);

    /* ── Notification prefs ── */
    const [notifs,      setNotifs]      = useState<NotificationPrefs>({
        newVerificationRequest: true, extensionRequest: true,
        repairClaim: true, claimScheduled: true, emailDigest: false,
    });
    const [savingNotif, setSavingNotif] = useState(false);

    const showToast = (ok: boolean, text: string) => {
        setToast({ ok, text });
        setTimeout(() => setToast(null), 4000);
    };

    const load = async () => {
        setLoading(true);
        try {
            const s = await vendorSettingsApi.get();
            setSettings(s);
            setName(s.name ?? '');
            setDisplayName(s.displayName ?? '');
            setBiz({ ...{ companyName:'',address:'',city:'',state:'',pincode:'',country:'India',website:'',supportPhone:'',supportEmail:'',gstNumber:'',description:'' }, ...s.business });
            setNotifs({ ...{ newVerificationRequest:true,extensionRequest:true,repairClaim:true,claimScheduled:true,emailDigest:false }, ...s.notifications });
        } catch { showToast(false, 'Failed to load settings.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    /* ── Handlers ── */
    const saveProfile = async () => {
        setSavingProf(true);
        try {
            await vendorSettingsApi.updateProfile({ name: name.trim(), displayName: displayName.trim() });
            showToast(true, 'Profile updated successfully!');
            if (user && name.trim()) {
                // Update local store so header reflects new name
                if (updateUser) updateUser({ ...user, name: name.trim() });
            }
        } catch (e: any) { showToast(false, e?.response?.data?.message ?? 'Update failed.'); }
        finally { setSavingProf(false); }
    };

    const savePassword = async () => {
        if (!curPw || !newPw || !confPw) { showToast(false, 'Fill all password fields.'); return; }
        if (newPw !== confPw) { showToast(false, 'Passwords do not match.'); return; }
        if (newPw.length < 6) { showToast(false, 'Password must be at least 6 characters.'); return; }
        setSavingPw(true);
        try {
            await vendorSettingsApi.changePassword({ currentPassword: curPw, newPassword: newPw, confirmPassword: confPw });
            showToast(true, 'Password changed successfully!');
            setCurPw(''); setNewPw(''); setConfPw('');
        } catch (e: any) { showToast(false, e?.response?.data?.message ?? 'Password change failed.'); }
        finally { setSavingPw(false); }
    };

    const saveBusiness = async () => {
        setSavingBiz(true);
        try {
            await vendorSettingsApi.updateBusiness(biz);
            showToast(true, 'Business details saved!');
        } catch (e: any) { showToast(false, e?.response?.data?.message ?? 'Save failed.'); }
        finally { setSavingBiz(false); }
    };

    const saveNotifs = async () => {
        setSavingNotif(true);
        try {
            await vendorSettingsApi.updateNotifications(notifs);
            showToast(true, 'Notification preferences saved!');
        } catch (e: any) { showToast(false, 'Save failed.'); }
        finally { setSavingNotif(false); }
    };

    const brandInitial = (settings?.brand || settings?.email || '?').charAt(0).toUpperCase();

    return (
        <div className="vs-page">
            {/* Header */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">Vendor <span className="vd-title-accent">Settings</span></h1>
                    <p className="vd-page-sub">Manage your vendor profile, business information, and preferences</p>
                </div>
                <button className="vd-btn-secondary" onClick={load} disabled={loading}>
                    <RefreshCw size={14} />Refresh
                </button>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`vs-toast ${toast.ok ? 'vs-toast-ok' : 'vs-toast-err'}`}>
                    {toast.ok ? <CheckCircle size={14}/> : <XCircle size={14}/>}
                    {toast.text}
                </div>
            )}

            {loading ? (
                <div className="vs-loading"><Loader2 size={22} className="vs-spin" />Loading settings…</div>
            ) : (
                <div className="vs-layout">
                    {/* ── Sidebar tabs ── */}
                    <div className="vs-tabs">
                        <div className="vs-vendor-card">
                            <div className="vs-avatar">{brandInitial}</div>
                            <div className="vs-vendor-name">{settings?.name || 'Vendor'}</div>
                            <div className="vs-vendor-email">{settings?.email}</div>
                            <div className="vs-vendor-brand">{settings?.brand || '—'}</div>
                        </div>

                        {([
                            { key: 'profile',       icon: User,      label: 'Profile & Password' },
                            { key: 'business',      icon: Building2, label: 'Business Details'   },
                            { key: 'notifications', icon: Bell,      label: 'Notifications'      },
                        ] as const).map(t => (
                            <button
                                key={t.key}
                                className={`vs-tab-btn ${tab === t.key ? 'vs-tab-active' : ''}`}
                                onClick={() => setTab(t.key)}
                            >
                                <t.icon size={15} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* ── Content panel ── */}
                    <div className="vs-panel">

                        {/* ════════ PROFILE TAB ════════ */}
                        {tab === 'profile' && (
                            <div className="vs-section-group">
                                {/* Profile info */}
                                <div className="vs-section">
                                    <div className="vs-section-hd">
                                        <User size={15}/> Profile Information
                                    </div>
                                    <div className="vs-field-grid">
                                        <div className="vs-field">
                                            <label>Display Name</label>
                                            <input className="vs-input" value={name}
                                                placeholder="Your name on the platform"
                                                onChange={e => setName(e.target.value)} />
                                        </div>
                                        <div className="vs-field">
                                            <label>Vendor Display Name</label>
                                            <input className="vs-input" value={displayName}
                                                placeholder="e.g. Samsung Support Team"
                                                onChange={e => setDisplayName(e.target.value)} />
                                        </div>
                                        <div className="vs-field">
                                            <label>Login Email <span className="vs-readonly">read-only</span></label>
                                            <input className="vs-input vs-input-disabled" value={settings?.email || ''} readOnly />
                                        </div>
                                        <div className="vs-field">
                                            <label>Brand <span className="vs-readonly">read-only</span></label>
                                            <input className="vs-input vs-input-disabled" value={settings?.brand || ''} readOnly />
                                        </div>
                                    </div>
                                    <button className="vs-save-btn" onClick={saveProfile} disabled={savingProf}>
                                        {savingProf ? <><Loader2 size={14} className="vs-spin"/>Saving…</> : <><Save size={14}/>Save Profile</>}
                                    </button>
                                </div>

                                {/* Password change */}
                                <div className="vs-section">
                                    <div className="vs-section-hd"><Lock size={15}/> Change Password</div>
                                    <div className="vs-field-grid">
                                        <div className="vs-field vs-field-full">
                                            <label>Current Password</label>
                                            <div className="vs-pw-wrap">
                                                <input className="vs-input" type={showCur ? 'text' : 'password'}
                                                    placeholder="Enter current password"
                                                    value={curPw} onChange={e => setCurPw(e.target.value)} />
                                                <button className="vs-eye" onClick={() => setShowCur(v => !v)}>
                                                    {showCur ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="vs-field">
                                            <label>New Password</label>
                                            <div className="vs-pw-wrap">
                                                <input className="vs-input" type={showNew ? 'text' : 'password'}
                                                    placeholder="Min 6 characters"
                                                    value={newPw} onChange={e => setNewPw(e.target.value)} />
                                                <button className="vs-eye" onClick={() => setShowNew(v => !v)}>
                                                    {showNew ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="vs-field">
                                            <label>Confirm New Password</label>
                                            <div className="vs-pw-wrap">
                                                <input className="vs-input" type={showConf ? 'text' : 'password'}
                                                    placeholder="Repeat new password"
                                                    value={confPw} onChange={e => setConfPw(e.target.value)} />
                                                <button className="vs-eye" onClick={() => setShowConf(v => !v)}>
                                                    {showConf ? <EyeOff size={14}/> : <Eye size={14}/>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Password strength indicator */}
                                    {newPw && (
                                        <div className="vs-strength">
                                            <div className="vs-str-bar">
                                                {[1,2,3,4].map(i => (
                                                    <div key={i} className={`vs-str-seg ${
                                                        newPw.length >= i * 3
                                                            ? newPw.length >= 12 ? 'vs-str-strong'
                                                            : newPw.length >= 8  ? 'vs-str-good'
                                                                                 : 'vs-str-weak'
                                                            : ''
                                                    }`} />
                                                ))}
                                            </div>
                                            <span className="vs-str-label">
                                                {newPw.length < 6 ? 'Too short' : newPw.length < 8 ? 'Weak' : newPw.length < 12 ? 'Good' : 'Strong'}
                                            </span>
                                        </div>
                                    )}
                                    <button className="vs-save-btn" onClick={savePassword} disabled={savingPw}>
                                        {savingPw ? <><Loader2 size={14} className="vs-spin"/>Changing…</> : <><ShieldCheck size={14}/>Change Password</>}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ════════ BUSINESS TAB ════════ */}
                        {tab === 'business' && (
                            <div className="vs-section">
                                <div className="vs-section-hd"><Building2 size={15}/> Business Details</div>
                                <div className="vs-field-grid">
                                    <div className="vs-field vs-field-full">
                                        <label><Building2 size={11}/>Company Name</label>
                                        <input className="vs-input" placeholder="Legal company name"
                                            value={biz.companyName} onChange={e => setBiz(b=>({...b,companyName:e.target.value}))} />
                                    </div>
                                    <div className="vs-field vs-field-full">
                                        <label><FileText size={11}/>Company Description</label>
                                        <textarea className="vs-textarea" rows={3}
                                            placeholder="Brief description of your company and services…"
                                            value={biz.description} onChange={e => setBiz(b=>({...b,description:e.target.value}))} />
                                    </div>
                                    <div className="vs-field vs-field-full">
                                        <label><MapPin size={11}/>Street Address</label>
                                        <input className="vs-input" placeholder="Building / Street / Area"
                                            value={biz.address} onChange={e => setBiz(b=>({...b,address:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label>City</label>
                                        <input className="vs-input" placeholder="e.g. Chennai"
                                            value={biz.city} onChange={e => setBiz(b=>({...b,city:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label>State</label>
                                        <input className="vs-input" placeholder="e.g. Tamil Nadu"
                                            value={biz.state} onChange={e => setBiz(b=>({...b,state:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label>Pincode</label>
                                        <input className="vs-input" placeholder="600001"
                                            value={biz.pincode} onChange={e => setBiz(b=>({...b,pincode:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label>Country</label>
                                        <input className="vs-input" placeholder="India"
                                            value={biz.country} onChange={e => setBiz(b=>({...b,country:e.target.value}))} />
                                    </div>

                                    <div className="vs-divider-row"><span>Contact Information</span></div>

                                    <div className="vs-field">
                                        <label><Globe size={11}/>Website</label>
                                        <input className="vs-input" placeholder="https://samsung.com"
                                            value={biz.website} onChange={e => setBiz(b=>({...b,website:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label><Phone size={11}/>Support Phone</label>
                                        <input className="vs-input" placeholder="1800-XXX-XXXX"
                                            value={biz.supportPhone} onChange={e => setBiz(b=>({...b,supportPhone:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label><Mail size={11}/>Support Email</label>
                                        <input className="vs-input" placeholder="support@brand.com"
                                            value={biz.supportEmail} onChange={e => setBiz(b=>({...b,supportEmail:e.target.value}))} />
                                    </div>
                                    <div className="vs-field">
                                        <label><Hash size={11}/>GST Number</label>
                                        <input className="vs-input" placeholder="22AAAAA0000A1Z5"
                                            value={biz.gstNumber} onChange={e => setBiz(b=>({...b,gstNumber:e.target.value}))} />
                                    </div>
                                </div>
                                <button className="vs-save-btn" onClick={saveBusiness} disabled={savingBiz}>
                                    {savingBiz ? <><Loader2 size={14} className="vs-spin"/>Saving…</> : <><Save size={14}/>Save Business Details</>}
                                </button>
                            </div>
                        )}

                        {/* ════════ NOTIFICATIONS TAB ════════ */}
                        {tab === 'notifications' && (
                            <div className="vs-section">
                                <div className="vs-section-hd"><Bell size={15}/> Notification Preferences</div>
                                <p className="vs-section-desc">Choose which events trigger notifications in your vendor portal.</p>

                                <div className="vs-toggles">
                                    {([
                                        { key: 'newVerificationRequest', label: 'New Verification Request',        desc: 'When a user submits a product verification to your brand'     },
                                        { key: 'extensionRequest',       label: 'Warranty Extension Request',      desc: 'When a user requests a warranty extension for your product'   },
                                        { key: 'repairClaim',            label: 'New Repair / Warranty Claim',      desc: 'When a user files a warranty claim with repair location'       },
                                        { key: 'claimScheduled',         label: 'Claim Visit Scheduled',           desc: 'Reminder when a service visit is coming up'                   },
                                        { key: 'emailDigest',            label: 'Daily Email Digest',              desc: 'Receive a daily summary of all pending requests via email'     },
                                    ] as { key: keyof NotificationPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                                        <div key={key} className="vs-toggle-row" onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}>
                                            <div className="vs-toggle-info">
                                                <div className="vs-toggle-label">{label}</div>
                                                <div className="vs-toggle-desc">{desc}</div>
                                            </div>
                                            <div className={`vs-toggle ${notifs[key] ? 'vs-toggle-on' : ''}`}>
                                                <div className="vs-toggle-knob" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="vs-save-btn" onClick={saveNotifs} disabled={savingNotif}>
                                    {savingNotif ? <><Loader2 size={14} className="vs-spin"/>Saving…</> : <><Save size={14}/>Save Preferences</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
