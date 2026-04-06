import { useDataStore } from '../../store/dataStore';
import { useAdminAuthStore } from '../../store/adminAuthStore';
import { Shield, Save } from 'lucide-react';

const toggleFields: { id: keyof ReturnType<typeof useDataStore.getState>['systemConfig']; label: string; desc: string }[] = [
    { id: 'biometricAuth', label: 'Biometric Authentication', desc: 'Require fingerprint for vault access.' },
    { id: 'autoArchive', label: 'Auto-Archive Protocol', desc: 'Move files older than 90 days to cold storage.' },
    { id: 'watermarking', label: 'Editorial Watermarking', desc: 'Embed hidden metadata into document exports.' },
    { id: 'emailAlerts', label: 'Warranty Expiry Alerts', desc: 'Email alerts at 30-day and 7-day marks.' },
    { id: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin logins.' },
    { id: 'auditLogging', label: 'Audit Logging', desc: 'Log all admin actions to immutable record.' },
    { id: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable user-facing portal access.' },
];

export default function AdminSettings() {
    const { systemConfig, updateSystemConfig, products, warranties, owners } = useDataStore();
    const { adminUser } = useAdminAuthStore();

    return (
        <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">System Settings</h1>
                    <p className="admin-page-sub">Global vault configuration — changes apply system-wide</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px', background: systemConfig.maintenanceMode ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.08)', border: `1px solid ${systemConfig.maintenanceMode ? 'rgba(248,113,113,0.25)' : 'rgba(74,222,128,0.2)'}`, borderRadius: '9999px' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: systemConfig.maintenanceMode ? '#f87171' : '#4ade80', display: 'inline-block' }} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: systemConfig.maintenanceMode ? '#f87171' : '#4ade80' }}>
                        {systemConfig.maintenanceMode ? 'Maintenance Mode' : 'System Online'}
                    </span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Admin profile */}
                <div className="admin-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%', background: 'linear-gradient(135deg, #1f108e, #3730a3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                            {adminUser?.name?.charAt(0) ?? 'A'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.125rem' }}>{adminUser?.name ?? 'Administrator'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{adminUser?.email}</div>
                            <span className="abadge abadge-indigo" style={{ marginTop: '4px', display: 'inline-flex' }}>Super Admin</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { label: 'Products', val: products.length },
                            { label: 'Warranties', val: warranties.length },
                            { label: 'Owners', val: owners.length },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#818cf8' }}>{s.val}</div>
                                <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System ID */}
                <div className="admin-card" style={{ padding: '1.75rem', background: '#0d1f16', border: '1px solid rgba(74,222,128,0.1)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '4px 10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, color: '#4ade80', marginBottom: '1rem' }}>
                        System Nominal
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Archival Integrity Verified</div>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>Last global audit completed 4 minutes ago. All databases online.</p>
                    <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)' }}>ID: ARCH-ADM-01</span>
                        <Shield size={32} style={{ color: 'rgba(255,255,255,0.08)' }} />
                    </div>
                </div>
            </div>

            {/* System Toggles */}
            <div className="admin-card">
                <div className="admin-card-header">
                    <div className="admin-card-title-row">
                        <Shield size={16} className="admin-card-title-icon" />
                        <h3 className="admin-card-title">System Configuration</h3>
                    </div>
                    <button className="admin-btn-secondary" style={{ padding: '0.4rem 0.875rem', fontSize: '0.75rem' }}>
                        <Save size={13} /> Export Config
                    </button>
                </div>
                <div style={{ padding: '0.5rem 0' }}>
                    {toggleFields.map(({ id, label, desc }) => (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{label}</p>
                                <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{desc}</p>
                            </div>
                            <button
                                style={{
                                    position: 'relative', width: 44, height: 24, borderRadius: 9999,
                                    background: systemConfig[id] ? '#4338ca' : 'rgba(255,255,255,0.1)',
                                    border: 'none', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0,
                                }}
                                onClick={() => updateSystemConfig({ [id]: !systemConfig[id] })}
                            >
                                <span style={{
                                    position: 'absolute', top: 2, left: 2, width: 20, height: 20,
                                    borderRadius: '50%', background: '#fff',
                                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                                    transition: 'transform 0.25s',
                                    transform: systemConfig[id] ? 'translateX(20px)' : 'translateX(0)',
                                }} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
