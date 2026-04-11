import { useState, useEffect } from 'react';
import {
    Newspaper, Plus, Edit2, Trash2,
    Save, X, AlertTriangle, CheckCircle, Image
} from 'lucide-react';
import api from '../../api/axios';
import './AdminNews.css';

interface NewsArticle {
    _id: string;
    title: string;
    summary: string;
    content: string;
    author: string;
    imageUrl: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

const DEFAULT_FORM = {
    title: '',
    summary: '',
    content: '',
    author: 'Admin',
    imageUrl: '',
    status: 'draft' as 'draft' | 'published' | 'archived',
};

export default function AdminNews() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchNews = async () => {
        try {
            const res = await api.get('/news');
            if (res.data?.success) setNews(res.data.data);
        } catch {
            showToast('error', 'Failed to load news articles.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNews(); }, []);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const resetForm = () => {
        setForm(DEFAULT_FORM);
        setEditId(null);
        setShowForm(false);
    };

    const handleEdit = (a: NewsArticle) => {
        setForm({
            title: a.title,
            summary: a.summary,
            content: a.content,
            author: a.author,
            imageUrl: a.imageUrl,
            status: a.status,
        });
        setEditId(a._id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ── Client-side validation ──
        if (!form.title.trim()) {
            showToast('error', 'Title is required.');
            return;
        }
        if (!form.summary.trim()) {
            showToast('error', 'Summary is required.');
            return;
        }
        if (!form.content.trim()) {
            showToast('error', 'Content is required.');
            return;
        }

        setSaving(true);
        try {
            if (editId) {
                await api.put(`/news/${editId}`, form);
                showToast('success', 'News article updated successfully.');
            } else {
                await api.post('/news', form);
                showToast('success', 'News article created successfully.');
            }
            resetForm();
            fetchNews();
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to save news article.';
            showToast('error', msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this news article?')) return;
        try {
            await api.delete(`/news/${id}`);
            showToast('success', 'News article deleted.');
            fetchNews();
        } catch {
            showToast('error', 'Failed to delete.');
        }
    };

    return (
        <div className="admin-news">
            {/* Toast */}
            {toast && (
                <div className={`news-toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="admin-page-header">
                <div>
                    <h1 className="admin-page-title">
                        <Newspaper size={22} /> News Management
                    </h1>
                    <p className="admin-page-sub">
                        Manage news articles shown on your landing page. Data stored in MongoDB.
                    </p>
                </div>
                <button className="news-add-btn" onClick={() => { resetForm(); setShowForm(true); }}>
                    <Plus size={16} /> New Article
                </button>
            </div>

            {/* Create/Edit Form */}
            {showForm && (
                <div className="news-form-card">
                    <div className="news-form-header">
                        <h3>{editId ? 'Edit Article' : 'Create New Article'}</h3>
                        <button className="news-form-close" onClick={resetForm}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="news-form">
                        <div className="news-field">
                            <label className="news-label">Title *</label>
                            <input
                                className="news-input"
                                value={form.title}
                                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Article Title"
                            />
                        </div>

                        <div className="news-field">
                            <label className="news-label">Summary *</label>
                            <textarea
                                className="news-textarea"
                                value={form.summary}
                                onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
                                placeholder="Short summary for the card..."
                                rows={2}
                            />
                        </div>

                        <div className="news-field">
                            <label className="news-label">Content *</label>
                            <textarea
                                className="news-textarea"
                                value={form.content}
                                onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="Full article content..."
                                rows={6}
                            />
                        </div>

                        <div className="news-field-row">
                            <div className="news-field news-field-half">
                                <label className="news-label">Author</label>
                                <input
                                    className="news-input"
                                    value={form.author}
                                    onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))}
                                    placeholder="Author Name"
                                />
                            </div>
                            <div className="news-field news-field-half">
                                <label className="news-label">Status</label>
                                <select 
                                    className="news-select"
                                    value={form.status}
                                    onChange={(e) => setForm(f => ({ ...f, status: e.target.value as any }))}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="news-form-actions">
                            <button type="button" className="news-btn-cancel" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="news-btn-save" disabled={saving}>
                                {saving ? <span className="news-spinner" /> : <Save size={15} />}
                                {editId ? 'Update' : 'Create'} Article
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* News List */}
            <div className="news-list">
                {loading ? (
                    <div className="news-loading">Loading news articles...</div>
                ) : news.length === 0 ? (
                    <div className="news-empty">
                        <Newspaper size={40} />
                        <h3>No Articles Yet</h3>
                        <p>Create your first news article to display on the landing page.</p>
                        <button className="news-add-btn" onClick={() => setShowForm(true)}>
                            <Plus size={16} /> Create Article
                        </button>
                    </div>
                ) : (
                    news.map((a) => (
                        <div key={a._id} className={`news-card ${a.status !== 'published' ? 'news-card-inactive' : ''}`}>
                            <div className="news-card-body">
                                <div className="news-card-top">
                                    <div className="news-card-title">{a.title}</div>
                                    <div className="news-card-summary">{a.summary}</div>
                                    <div className="news-card-meta">
                                        <span className={`news-status-badge ${a.status}`}>
                                            {a.status}
                                        </span>
                                        <span className="news-meta-tag">By {a.author}</span>
                                        {a.publishedAt && (
                                            <span className="news-meta-tag">
                                                Published: {new Date(a.publishedAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="news-card-actions">
                                    <button className="news-action-btn edit" onClick={() => handleEdit(a)} title="Edit">
                                        <Edit2 size={15} />
                                    </button>
                                    <button className="news-action-btn delete" onClick={() => handleDelete(a._id)} title="Delete">
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
