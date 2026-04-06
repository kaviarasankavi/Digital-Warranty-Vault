import { useState } from 'react';
import { useDataStore } from '../../store/dataStore';
import { CheckCircle, XCircle, Plus, Search, X, Save } from 'lucide-react';
import '../Admin/AdminProducts.css';

export default function AdminAuthenticity() {
    const { verificationChecks, addVerificationCheck } = useDataStore();
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newCheck, setNewCheck] = useState({ productName: '', vendor: '', serialHash: '', result: true });

    const filtered = verificationChecks.filter((c) =>
        c.productName.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = () => {
        if (!newCheck.productName || !newCheck.serialHash) return;
        addVerificationCheck({
            id: `CHK-${String(verificationChecks.length + 1).padStart(4, '0')}`,
            serialHash: newCheck.serialHash,
            productName: newCheck.productName,
            vendor: newCheck.vendor,
            result: newCheck.result,
            checkedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() + ', ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            ownerName: '—',
            ipAddress: '127.0.0.1',
        });
        setShowAdd(false);
        setNewCheck({ productName: '', vendor: '', serialHash: '', result: true });
    };

    const total = verificationChecks.length;
    const authentic = verificationChecks.filter((c) => c.result).length;
    const flagged = total - authentic;

    return (
        <div style={{ color: '#fff' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Authenticity Log</h1>
                    <p className="admin-page-sub">Full audit trail of all serial verification checks</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="admin-search-box">
                        <Search size={15} />
                        <input type="text" placeholder="Search checks..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search-input" />
                    </div>
                    <button className="admin-btn-primary" onClick={() => setShowAdd(true)}><Plus size={16} /> Log Check</button>
                </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Checks', value: total, color: '#818cf8' },
                    { label: 'Authentic', value: authentic, color: '#4ade80' },
                    { label: 'Flagged', value: flagged, color: '#f87171' },
                ].map((s) => (
                    <div key={s.label} style={{ background: '#15152a', borderRadius: '1rem', padding: '1.25rem 1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '4px', fontWeight: 600 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {showAdd && (
                <div className="admin-modal-overlay" onClick={() => setShowAdd(false)}>
                    <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Log Verification Check</h3>
                            <button className="admin-modal-close" onClick={() => setShowAdd(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="admin-form-field">
                                    <label>Product Name *</label>
                                    <input className="admin-input" value={newCheck.productName} onChange={(e) => setNewCheck((f) => ({ ...f, productName: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Vendor</label>
                                    <input className="admin-input" value={newCheck.vendor} onChange={(e) => setNewCheck((f) => ({ ...f, vendor: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Serial Hash *</label>
                                    <input className="admin-input" value={newCheck.serialHash} onChange={(e) => setNewCheck((f) => ({ ...f, serialHash: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Result</label>
                                    <select className="admin-input admin-select" value={newCheck.result ? 'true' : 'false'} onChange={(e) => setNewCheck((f) => ({ ...f, result: e.target.value === 'true' }))}>
                                        <option value="true">✓ Authentic</option>
                                        <option value="false">✗ Flagged</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="admin-btn-primary" onClick={handleAdd}><Save size={15} /> Log Check</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Check ID</th>
                                <th>Product</th>
                                <th>Serial Hash</th>
                                <th>Owner</th>
                                <th>IP Address</th>
                                <th>Checked At</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((c) => (
                                <tr key={c.id}>
                                    <td className="admin-mono">{c.id}</td>
                                    <td style={{ color: '#fff', fontWeight: 600 }}>{c.productName}</td>
                                    <td className="admin-mono">{c.serialHash}</td>
                                    <td>{c.ownerName}</td>
                                    <td className="admin-mono">{c.ipAddress}</td>
                                    <td className="admin-mono">{c.checkedAt}</td>
                                    <td>
                                        {c.result
                                            ? <span className="abadge abadge-green"><CheckCircle size={10} /> Authentic</span>
                                            : <span className="abadge abadge-red"><XCircle size={10} /> Flagged</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '2rem' }}>No checks found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
