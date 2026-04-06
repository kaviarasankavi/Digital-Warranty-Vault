import { useState } from 'react';
import { useDataStore, type Owner, type OwnerStatus } from '../../store/dataStore';
import { Plus, Pencil, Trash2, Search, X, Save, UserCheck, UserX, Clock } from 'lucide-react';
import '../Admin/AdminProducts.css';

const statusColors: Record<OwnerStatus, string> = {
    verified: 'abadge-green',
    pending: 'abadge-amber',
    suspended: 'abadge-red',
};

const colorClasses = ['owner-color-indigo', 'owner-color-coral', 'owner-color-slate', 'owner-color-sage', 'owner-color-red'];

export default function AdminOwners() {
    const { owners, addOwner, updateOwner, deleteOwner, setOwnerStatus } = useDataStore();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Owner>>({});

    const filtered = owners.filter((o) =>
        o.name.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        const initials = 'NW';
        setForm({
            name: '', email: '', description: '', assetsCount: 0,
            status: 'pending', lastActivity: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
            initials, colorClass: colorClasses[owners.length % colorClasses.length],
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleOpenEdit = (o: Owner) => {
        setForm({ ...o });
        setEditingId(o.id);
        setShowForm(true);
    };

    const handleSave = () => {
        if (!form.name || !form.email) return;
        const initials = form.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
        if (editingId) {
            updateOwner(editingId, { ...form, initials });
        } else {
            const id = `OWN-${String(owners.length + 1).padStart(3, '0')}`;
            addOwner({ ...form, id, initials } as Owner);
        }
        setShowForm(false);
    };

    return (
        <div style={{ color: '#fff' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Owners</h1>
                    <p className="admin-page-sub">Manage registered asset owners — approve, suspend, or modify records</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="admin-search-box">
                        <Search size={15} />
                        <input type="text" placeholder="Search owners..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search-input" />
                    </div>
                    <button className="admin-btn-primary" onClick={handleOpenAdd}><Plus size={16} /> Add Owner</button>
                </div>
            </div>

            {/* Quick approve/suspend chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {owners.filter((o) => o.status === 'pending').map((o) => (
                    <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 12px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '9999px' }}>
                        <Clock size={12} style={{ color: '#fbbf24' }} />
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>{o.name} pending</span>
                        <button style={{ fontSize: '0.65rem', fontWeight: 700, color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOwnerStatus(o.id, 'verified')}>Approve</button>
                        <button style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setOwnerStatus(o.id, 'suspended')}>Reject</button>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? 'Edit Owner' : 'Add Owner'}</h3>
                            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-grid">
                                <div className="admin-form-field">
                                    <label>Full Name *</label>
                                    <input className="admin-input" value={form.name ?? ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Email *</label>
                                    <input className="admin-input" type="email" value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Status</label>
                                    <select className="admin-input admin-select" value={form.status ?? 'pending'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as OwnerStatus }))}>
                                        <option value="verified">Verified</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Assets Count</label>
                                    <input className="admin-input" type="number" value={form.assetsCount ?? 0} onChange={(e) => setForm((f) => ({ ...f, assetsCount: Number(e.target.value) }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Phone</label>
                                    <input className="admin-input" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Address</label>
                                    <input className="admin-input" value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                                </div>
                                <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                                    <label>Description</label>
                                    <textarea className="admin-input admin-textarea" value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="admin-btn-primary" onClick={handleSave}><Save size={15} /> {editingId ? 'Update' : 'Add'} Owner</button>
                        </div>
                    </div>
                </div>
            )}

            {confirmDelete && (
                <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="admin-modal-close" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Delete this owner? Their profile will be removed from the user portal.</p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="admin-btn-danger" onClick={() => { deleteOwner(confirmDelete!); setConfirmDelete(null); }}><Trash2 size={14} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Owner</th>
                                <th>Email</th>
                                <th>Assets</th>
                                <th>Last Activity</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((o) => (
                                <tr key={o.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className={`owner-status-avatar ${o.colorClass}`}>{o.initials}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, color: '#fff' }}>{o.name}</div>
                                                <div className="admin-mono">{o.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{o.email}</td>
                                    <td style={{ fontWeight: 700, color: '#818cf8' }}>{o.assetsCount}</td>
                                    <td className="admin-mono">{o.lastActivity}</td>
                                    <td>
                                        <span className={`abadge ${statusColors[o.status]}`}>{o.status}</span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            {o.status === 'pending' && <button className="admin-btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }} onClick={() => setOwnerStatus(o.id, 'verified')}><UserCheck size={12} /> Approve</button>}
                                            {o.status === 'verified' && <button className="admin-btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }} onClick={() => setOwnerStatus(o.id, 'suspended')}><UserX size={12} /> Suspend</button>}
                                            {o.status === 'suspended' && <button className="admin-btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.72rem' }} onClick={() => setOwnerStatus(o.id, 'verified')}><UserCheck size={12} /> Restore</button>}
                                            <button className="admin-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleOpenEdit(o)}><Pencil size={13} /></button>
                                            <button className="admin-btn-danger" onClick={() => setConfirmDelete(o.id)}><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '2rem' }}>No owners found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
