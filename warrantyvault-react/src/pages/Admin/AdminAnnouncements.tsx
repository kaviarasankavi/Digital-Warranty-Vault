import { useState, useEffect } from 'react';
import {
    Megaphone, Plus, Edit2, Trash2, Eye, EyeOff,
    Save, X, AlertTriangle, CheckCircle, Palette, Link2, ArrowUpDown,
} from 'lucide-react';
import api from '../../api/axios';
import './AdminAnnouncements.css';

interface Announcement {
    id: number;
    message: string;
    link_text: string | null;
    link_url: string | null;
    bg_color: string;
    text_color: string;
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

const DEFAULT_FORM = {
    message: '',
    link_text: '',
    link_url: '',
    bg_color: '#6366f1',
    text_color: '#ffffff',
    is_active: true,
    priority: 0,
};

const PRESET_COLORS = [
    { label: 'Indigo', bg: '#6366f1', text: '#ffffff' },
    { label: 'Emerald', bg: '#059669', text: '#ffffff' },
    { label: 'Rose', bg: '#e11d48', text: '#ffffff' },
    { label: 'Amber', bg: '#d97706', text: '#ffffff' },
    { label: 'Sky', bg: '#0284c7', text: '#ffffff' },
    { label: 'Slate', bg: '#1e293b', text: '#ffffff' },
    { label: 'Fuchsia', bg: '#c026d3', text: '#ffffff' },
    { label: 'Orange', bg: '#ea580c', text: '#ffffff' },
];

export default function AdminAnnouncements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get('/announcements');
            if (res.data?.success) setAnnouncements(res.data.data);
        } catch {
            showToast('error', 'Failed to load announcements.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setForm(DEFAULT_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const handleEdit = (a: Announcement) => {
        setForm({
            message: a.message,
            link_text: a.link_text || '',
            link_url: a.link_url || '',
            bg_color: a.bg_color,
            text_color: a.text_color,
            is_active: a.is_active,
            priority: a.priority,
        });
        setEditId(a.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ── Client-side validation ──
        if (!form.message.trim()) {
            showToast('error', 'Message is required. Please enter the announcement text.');
            return;
        }
        if (form.message.trim().length < 5) {
            showToast('error', 'Message must be at least 5 characters.');
            return;
        }
        if (form.message.trim().length > 300) {
            showToast('error', 'Message must not exceed 300 characters.');
            return;
        }
        if (form.link_text && form.link_text.trim().length > 50) {
            showToast('error', 'Link text must not exceed 50 characters.');
            return;
        }
        if (form.link_url && form.link_url.trim()) {
            try {
                new URL(form.link_url.trim());
            } catch {
                showToast('error', 'Link URL must be a valid URL (e.g. https://example.com).');
                return;
            }
        }
        if (form.link_text && form.link_text.trim() && !form.link_url?.trim()) {
            showToast('error', 'Please provide a Link URL when specifying Link Text.');
            return;
        }
        if (form.priority < 0 || form.priority > 100) {
            showToast('error', 'Priority must be between 0 and 100.');
            return;
        }

        setSaving(true);
        try {
            if (editId) {
                await api.put(`/announcements/${editId}`, form);
                showToast('success', 'Announcement updated successfully.');
            } else {
                await api.post('/announcements', form);
                showToast('success', 'Announcement created successfully.');
            }
            resetForm();
            fetchAnnouncements();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save announcement. Please try again.';
            showToast('error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this announcement?')) return;
        try {
            await api.delete(`/announcements/${id}`);
            showToast('success', 'Announcement deleted.');
            fetchAnnouncements();
        } catch {
            showToast('error', 'Failed to delete.');
        }
    };

    const handleToggle = async (id: number) => {
        try {
            await api.patch(`/announcements/${id}/toggle`);
            fetchAnnouncements();
        } catch {
            showToast('error', 'Failed to toggle.');
        }
    };

    return (
        <div className="admin-announcements">
            {/* Toast */}
            {toast && (
                <div className={`ann-toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        <Megaphone size={22} /> Announcement Bar
                    </h1>
                    <p className="admin-page-sub">
                        Manage announcements shown at the top of your landing page. Data stored in MySQL.
                    </p>
                </div>
                <button className="ann-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus size={16} /> New Announcement
                </button>
            </div>

            {/* Live Preview */}
            {announcements.filter(a => a.is_active).length > 0 && (
                <div className="ann-preview-section">
                    <h3 className="ann-preview-title">🔴 Live Preview</h3>
                    <div
                        className="ann-preview-bar"
                        style={{
                            background: announcements.find(a => a.is_active)?.bg_color || '#6366f1',
                            color: announcements.find(a => a.is_active)?.text_color || '#fff',
                        }}
                    >
                        <Megaphone size={14} />
                        <span>{announcements.find(a => a.is_active)?.message}</span>
                        {announcements.find(a => a.is_active)?.link_text && (
                            <span className="ann-preview-link">
                                {announcements.find(a => a.is_active)?.link_text} →
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
                <div className="ann-form-card">
                    <div className="ann-form-header">
                        <h3>{editId ? 'Edit Announcement' : 'Create New Announcement'}</h3>
                        <button className="ann-form-close" onClick={resetForm}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="ann-form">
                        {/* Message */}
                        <div className="ann-field">
                            <label className="ann-label">Message *</label>
                            <textarea
                                className="ann-textarea"
                                value={form.message}
                                onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))}
                                placeholder="🎉 Big Summer Sale — 50% off all plans!"
                                rows={2}
                            />
                        </div>

                        {/* Link */}
                        <div className="ann-field-row">
                            <div className="ann-field ann-field-half">
                                <label className="ann-label"><Link2 size={13} /> Link Text</label>
                                <input
                                    className="ann-input"
                                    value={form.link_text}
                                    onChange={(e) => setForm(f => ({ ...f, link_text: e.target.value }))}
                                    placeholder="Learn more"
                                />
                            </div>
                            <div className="ann-field ann-field-half">
                                <label className="ann-label"><Link2 size={13} /> Link URL</label>
                                <input
                                    className="ann-input"
                                    value={form.link_url}
                                    onChange={(e) => setForm(f => ({ ...f, link_url: e.target.value }))}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="ann-field">
                            <label className="ann-label"><Palette size={13} /> Color Theme</label>
                            <div className="ann-color-presets">
                                {PRESET_COLORS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        className={`ann-color-chip ${form.bg_color === preset.bg ? 'selected' : ''}`}
                                        style={{ background: preset.bg, color: preset.text }}
                                        onClick={() => setForm(f => ({ ...f, bg_color: preset.bg, text_color: preset.text }))}
                                        title={preset.label}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div className="ann-color-custom">
                                <div className="ann-color-pair">
                                    <label>Background</label>
                                    <input
                                        type="color"
                                        value={form.bg_color}
                                        onChange={(e) => setForm(f => ({ ...f, bg_color: e.target.value }))}
                                    />
                                    <span className="ann-color-hex">{form.bg_color}</span>
                                </div>
                                <div className="ann-color-pair">
                                    <label>Text</label>
                                    <input
                                        type="color"
                                        value={form.text_color}
                                        onChange={(e) => setForm(f => ({ ...f, text_color: e.target.value }))}
                                    />
                                    <span className="ann-color-hex">{form.text_color}</span>
                                </div>
                            </div>
                        </div>

                        {/* Priority + Active */}
                        <div className="ann-field-row">
                            <div className="ann-field ann-field-half">
                                <label className="ann-label"><ArrowUpDown size={13} /> Priority</label>
                                <input
                                    type="number"
                                    className="ann-input"
                                    value={form.priority}
                                    onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                                    min={0}
                                />
                            </div>
                            <div className="ann-field ann-field-half">
                                <label className="ann-label">Status</label>
                                <label className="ann-toggle-label">
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
                                    />
                                    <span className="ann-toggle-slider" />
                                    <span>{form.is_active ? 'Active' : 'Inactive'}</span>
                                </label>
                            </div>
                        </div>

                        {/* Form preview */}
                        <div className="ann-field">
                            <label className="ann-label">Preview</label>
                            <div
                                className="ann-form-preview"
                                style={{ background: form.bg_color, color: form.text_color }}
                            >
                                <Megaphone size={14} />
                                <span>{form.message || 'Your announcement will appear here...'}</span>
                                {form.link_text && <span style={{ fontWeight: 700, textDecoration: 'underline' }}>{form.link_text}</span>}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="ann-form-actions">
                            <button type="button" className="ann-btn-cancel" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="ann-btn-save" disabled={saving}>
                                {saving ? <span className="ann-spinner" /> : <Save size={15} />}
                                {editId ? 'Update' : 'Create'} Announcement
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Announcements List */}
            <div className="ann-list">
                {loading ? (
                    <div className="ann-loading">Loading announcements...</div>
                ) : announcements.length === 0 ? (
                    <div className="ann-empty">
                        <Megaphone size={40} />
                        <h3>No Announcements Yet</h3>
                        <p>Create your first announcement to display on the landing page.</p>
                        <button className="ann-add-btn" onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Create Announcement
                        </button>
                    </div>
                ) : (
                    announcements.map((a) => (
                        <div key={a.id} className={`ann-card ${!a.is_active ? 'ann-card-inactive' : ''}`}>
                            <div
                                className="ann-card-color-bar"
                                style={{ background: a.bg_color }}
                            />
                            <div className="ann-card-body">
                                <div className="ann-card-top">
                                    <div className="ann-card-message">{a.message}</div>
                                    <div className="ann-card-meta">
                                        {a.link_text && (
                                            <span className="ann-meta-tag">
                                                <Link2 size={11} /> {a.link_text}
                                            </span>
                                        )}
                                        <span className={`ann-status-badge ${a.is_active ? 'active' : 'inactive'}`}>
                                            {a.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="ann-meta-tag">Priority: {a.priority}</span>
                                    </div>
                                </div>
                                <div className="ann-card-actions">
                                    <button
                                        className="ann-action-btn"
                                        onClick={() => handleToggle(a.id)}
                                        title={a.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        {a.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                    <button className="ann-action-btn edit" onClick={() => handleEdit(a)} title="Edit">
                                        <Edit2 size={15} />
                                    </button>
                                    <button className="ann-action-btn delete" onClick={() => handleDelete(a.id)} title="Delete">
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
