import { useState } from 'react';
import { useDataStore, type Warranty, type WarrantyStatus } from '../../store/dataStore';
import { Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';
import '../Admin/AdminProducts.css';

const statusColors: Record<WarrantyStatus, string> = {
    active: 'abadge-green',
    expiring: 'abadge-amber',
    expired: 'abadge-slate',
    claimed: 'abadge-indigo',
};

export default function AdminWarranties() {
    const { warranties, products, owners, updateWarranty, deleteWarranty, addWarranty } = useDataStore();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Warranty>>({});

    const filtered = warranties.filter((w) =>
        w.productName.toLowerCase().includes(search.toLowerCase()) ||
        w.id.toLowerCase().includes(search.toLowerCase()) ||
        w.vendorName.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenEdit = (w: Warranty) => {
        setForm({ ...w });
        setEditingId(w.id);
        setShowForm(true);
    };

    const handleOpenAdd = () => {
        setForm({
            id: `WRT-${String(warranties.length + 1).padStart(4, '0')}`,
            productName: '', vendorName: '', serialId: '', type: 'standard',
            startDate: '', endDate: '', status: 'active', coverageDetails: '',
            productId: '', ownerId: '', ownerName: '',
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleSave = () => {
        if (!form.productName || !form.serialId) return;
        if (editingId) {
            updateWarranty(editingId, form);
        } else {
            addWarranty(form as Warranty);
        }
        setShowForm(false);
    };

    return (
        <div style={{ color: '#fff' }}>
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Warranties</h1>
                    <p className="admin-page-sub">Manage warranty records — status changes reflect on user portal</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="admin-search-box">
                        <Search size={15} />
                        <input type="text" placeholder="Search warranties..." value={search} onChange={(e) => setSearch(e.target.value)} className="admin-search-input" />
                    </div>
                    <button className="admin-btn-primary" onClick={handleOpenAdd}><Plus size={16} /> Add Warranty</button>
                </div>
            </div>

            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? 'Edit Warranty' : 'Add Warranty'}</h3>
                            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-grid">
                                <div className="admin-form-field">
                                    <label>Warranty ID</label>
                                    <input className="admin-input admin-mono" value={form.id ?? ''} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Product Name *</label>
                                    <select className="admin-input admin-select" value={form.productId ?? ''} onChange={(e) => {
                                        const p = products.find((p) => p.id === e.target.value);
                                        setForm((f) => ({ ...f, productId: e.target.value, productName: p?.name ?? f.productName, vendorName: p?.vendorName ?? f.vendorName, serialId: p?.serialNumber ?? f.serialId }));
                                    }}>
                                        <option value="">Select product...</option>
                                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Serial ID *</label>
                                    <input className="admin-input" value={form.serialId ?? ''} onChange={(e) => setForm((f) => ({ ...f, serialId: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Type</label>
                                    <select className="admin-input admin-select" value={form.type ?? 'standard'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}>
                                        <option value="standard">Standard</option>
                                        <option value="extended">Extended</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Status</label>
                                    <select className="admin-input admin-select" value={form.status ?? 'active'} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as WarrantyStatus }))}>
                                        <option value="active">Active</option>
                                        <option value="expiring">Expiring</option>
                                        <option value="expired">Expired</option>
                                        <option value="claimed">Claimed</option>
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Owner</label>
                                    <select className="admin-input admin-select" value={form.ownerId ?? ''} onChange={(e) => {
                                        const o = owners.find((o) => o.id === e.target.value);
                                        setForm((f) => ({ ...f, ownerId: e.target.value, ownerName: o?.name ?? '' }));
                                    }}>
                                        <option value="">Select owner...</option>
                                        {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Start Date</label>
                                    <input className="admin-input" type="date" value={form.startDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>End Date</label>
                                    <input className="admin-input" type="date" value={form.endDate ?? ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                                </div>
                                <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                                    <label>Coverage Details</label>
                                    <input className="admin-input" value={form.coverageDetails ?? ''} onChange={(e) => setForm((f) => ({ ...f, coverageDetails: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="admin-btn-primary" onClick={handleSave}><Save size={15} /> {editingId ? 'Update' : 'Add'} Warranty</button>
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
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>Delete this warranty? This will remove it from the user portal.</p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="admin-btn-danger" onClick={() => { deleteWarranty(confirmDelete!); setConfirmDelete(null); }}><Trash2 size={14} /> Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Warranty ID</th>
                                <th>Product</th>
                                <th>Vendor</th>
                                <th>Owner</th>
                                <th>Type</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((w) => (
                                <tr key={w.id}>
                                    <td className="admin-mono">{w.id}</td>
                                    <td style={{ color: '#fff', fontWeight: 600 }}>{w.productName}</td>
                                    <td>{w.vendorName}</td>
                                    <td>{w.ownerName ?? '—'}</td>
                                    <td><span className="abadge abadge-indigo">{w.type}</span></td>
                                    <td className="admin-mono">{w.endDate}</td>
                                    <td><span className={`abadge ${statusColors[w.status]}`}>{w.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <select className="admin-input admin-select" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: 'auto' }}
                                                value={w.status}
                                                onChange={(e) => updateWarranty(w.id, { status: e.target.value as WarrantyStatus })}
                                            >
                                                <option value="active">Active</option>
                                                <option value="expiring">Expiring</option>
                                                <option value="expired">Expired</option>
                                                <option value="claimed">Claimed</option>
                                            </select>
                                            <button className="admin-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleOpenEdit(w)}><Pencil size={13} /></button>
                                            <button className="admin-btn-danger" onClick={() => setConfirmDelete(w.id)}><Trash2 size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '2rem' }}>No warranties found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
