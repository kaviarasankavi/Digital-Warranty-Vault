import { useState } from 'react';
import { useDataStore, type Product } from '../../store/dataStore';
import { Plus, Pencil, Trash2, Search, X, Save } from 'lucide-react';
import './AdminProducts.css';

const EMPTY_FORM: Omit<Product, 'id'> = {
    name: '', vendorId: '', vendorName: '', category: 'electronics',
    serialNumber: '', purchaseDate: '', price: 0, description: '',
};

export default function AdminProducts() {
    const { products, vendors, addProduct, updateProduct, deleteProduct } = useDataStore();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY_FORM);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
        p.vendorName.toLowerCase().includes(search.toLowerCase())
    );

    const handleOpenAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const handleOpenEdit = (p: Product) => {
        const { id, ...rest } = p;
        setForm(rest);
        setEditingId(id);
        setShowForm(true);
    };

    const handleVendorChange = (vendorId: string) => {
        const v = vendors.find((v) => v.id === vendorId);
        setForm((f) => ({ ...f, vendorId, vendorName: v?.name ?? '' }));
    };

    const handleSave = () => {
        if (!form.name || !form.serialNumber || !form.vendorId) return;
        if (editingId) {
            updateProduct(editingId, form);
        } else {
            const id = `PRD-${String(products.length + 1).padStart(3, '0')}`;
            addProduct({ id, ...form });
        }
        setShowForm(false);
        setEditingId(null);
    };

    return (
        <div className="admin-products">
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">Products</h1>
                    <p className="admin-page-sub">Manage all registered products — changes reflect on user portal instantly</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div className="admin-search-box">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="admin-search-input"
                        />
                    </div>
                    <button className="admin-btn-primary" onClick={handleOpenAdd}>
                        <Plus size={16} /> Add Product
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                            <button className="admin-modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <div className="admin-form-grid">
                                <div className="admin-form-field">
                                    <label>Product Name *</label>
                                    <input className="admin-input" placeholder="e.g. Sony Bravia XR" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Vendor *</label>
                                    <select className="admin-input admin-select" value={form.vendorId} onChange={(e) => handleVendorChange(e.target.value)}>
                                        <option value="">Select vendor...</option>
                                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Category</label>
                                    <select className="admin-input admin-select" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as any }))}>
                                        {['electronics', 'appliances', 'automotive', 'jewelry', 'photography', 'other'].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div className="admin-form-field">
                                    <label>Serial Number *</label>
                                    <input className="admin-input" placeholder="SN-XXXX-0000" value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Purchase Date</label>
                                    <input className="admin-input" type="date" value={form.purchaseDate} onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))} />
                                </div>
                                <div className="admin-form-field">
                                    <label>Price (USD)</label>
                                    <input className="admin-input" type="number" placeholder="0" value={form.price || ''} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
                                </div>
                                <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                                    <label>Description</label>
                                    <textarea className="admin-input admin-textarea" placeholder="Product description..." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                                </div>
                            </div>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button className="admin-btn-primary" onClick={handleSave}><Save size={15} /> {editingId ? 'Update' : 'Save'} Product</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete */}
            {confirmDelete && (
                <div className="admin-modal-overlay" onClick={() => setConfirmDelete(null)}>
                    <div className="admin-modal admin-modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="admin-modal-header">
                            <h3>Confirm Delete</h3>
                            <button className="admin-modal-close" onClick={() => setConfirmDelete(null)}><X size={18} /></button>
                        </div>
                        <div className="admin-modal-body">
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                                Are you sure you want to delete this product? This action will also affect associated warranties on the user portal.
                            </p>
                        </div>
                        <div className="admin-modal-footer">
                            <button className="admin-btn-secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
                            <button className="admin-btn-danger" onClick={() => { deleteProduct(confirmDelete!); setConfirmDelete(null); }}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Vendor</th>
                                <th>Category</th>
                                <th>Serial #</th>
                                <th>Price</th>
                                <th>Purchase Date</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#fff' }}>{p.name}</div>
                                        <div className="admin-mono">{p.id}</div>
                                    </td>
                                    <td>{p.vendorName}</td>
                                    <td>
                                        <span className="abadge abadge-indigo">{p.category}</span>
                                    </td>
                                    <td className="admin-mono">{p.serialNumber}</td>
                                    <td style={{ color: '#4ade80', fontWeight: 700 }}>${p.price.toLocaleString()}</td>
                                    <td className="admin-mono">{p.purchaseDate}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="admin-btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleOpenEdit(p)}>
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button className="admin-btn-danger" onClick={() => setConfirmDelete(p.id)}>
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '2rem' }}>No products found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
