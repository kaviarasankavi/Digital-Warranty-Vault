import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    Search,
    Shield,
    Filter,
    Grid,
    List,
    CheckCircle,
    AlertCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    X,
    ArrowUpDown,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { productApi, type Product, type ProductFormData, type ProductQueryParams, type Pagination } from '../../api/productApi';
import { ProductModal } from './ProductModal';
import '../../styles/userDashboard.css';
import './Products.css';

const WARRANTY_TABS = [
    { key: '', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expiring_soon', label: 'Expiring Soon' },
    { key: 'expired', label: 'Expired' },
];

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Date Added' },
    { value: 'name', label: 'Name' },
    { value: 'purchasePrice', label: 'Price' },
    { value: 'purchaseDate', label: 'Purchase Date' },
    { value: 'warrantyExpiry', label: 'Warranty Expiry' },
];

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // ── Filter state ──
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [warrantyStatus, setWarrantyStatus] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [categories, setCategories] = useState<string[]>([]);

    // ── Pagination state ──
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 12,
        totalCount: 0,
        totalPages: 0,
    });

    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounce search input
    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination((prev) => ({ ...prev, page: 1 }));
        }, 300);
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [search]);

    // Fetch categories for filter dropdown
    useEffect(() => {
        productApi.getCategories().then((res) => setCategories(res.data)).catch(() => {});
    }, []);

    // Fetch products whenever filters change
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params: ProductQueryParams = {
                page: pagination.page,
                limit: pagination.limit,
                sortBy,
                sortOrder,
            };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category) params.category = category;
            if (warrantyStatus) params.warrantyStatus = warrantyStatus;
            if (minPrice) params.minPrice = parseFloat(minPrice);
            if (maxPrice) params.maxPrice = parseFloat(maxPrice);

            const res = await productApi.getAll(params);
            setProducts(res.data);
            setPagination(res.pagination);
        } catch (err: any) {
            console.error('Failed to fetch products:', err);
            // Don't do anything on 401 errors - the axios interceptor will handle it
            if (err?.response?.status !== 401) {
                // Handle other errors gracefully
                setProducts([]);
            }
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, warrantyStatus, minPrice, maxPrice, sortBy, sortOrder, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ── Handlers ──
    const handleCreate = () => {
        setEditProduct(null);
        setSaveError(null);
        setModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditProduct(product);
        setSaveError(null);
        setModalOpen(true);
    };

    const handleSave = async (data: ProductFormData) => {
        try {
            setSaving(true);
            setSaveError(null);
            if (editProduct) {
                await productApi.update(editProduct.id, data);
            } else {
                await productApi.create(data);
            }
            setModalOpen(false);
            setEditProduct(null);
            await fetchProducts();
            // Refresh categories
            productApi.getCategories().then((res) => setCategories(res.data)).catch(() => {});
        } catch (err: any) {
            // Extract the server error message and display in modal
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'An unexpected error occurred. Please try again.';
            setSaveError(message);
            console.error('Failed to save product:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await productApi.delete(id);
            setDeleteConfirm(null);
            await fetchProducts();
        } catch (err) {
            console.error('Failed to delete product:', err);
        }
    };

    const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
        setter(value);
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const clearFilters = () => {
        setCategory('');
        setWarrantyStatus('');
        setMinPrice('');
        setMaxPrice('');
        setSortBy('createdAt');
        setSortOrder('desc');
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const hasActiveFilters = category || warrantyStatus || minPrice || maxPrice || sortBy !== 'createdAt' || sortOrder !== 'desc';

    const toggleSortOrder = () => {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getWarrantyStatus = (expiry: string) => {
        if (!expiry) return { label: 'No Warranty', className: 'status-unknown', icon: AlertCircle };
        const days = Math.ceil(
            (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (days < 0) return { label: 'Expired', className: 'status-expired', icon: AlertCircle };
        if (days <= 30) return { label: `${days}d left`, className: 'status-warning', icon: Clock };
        return { label: 'Active', className: 'status-active', icon: CheckCircle };
    };

    const getProductEmoji = (cat: string) => {
        const emojis: Record<string, string> = {
            'Electronics': '💻',
            'Appliances': '🔌',
            'Audio': '🎧',
            'Camera': '📷',
            'Phone': '📱',
            'Watch': '⌚',
            'Drone': '🚁',
            'Gaming': '🎮',
            'Computing': '🖥️',
            'Wearables': '⌚',
            'Camera & Drones': '📷',
            'default': '📦'
        };
        return emojis[cat] || emojis['default'];
    };

    return (
        <div className="user-dashboard-main">
            <Header title="My" subtitle="Vault" />

            <div className="user-dashboard-content">
                {/* Stats Overview */}
                <div className="vault-stats-row user-animate-in user-animate-in-1">
                    <div className="vault-stat-item">
                        <div className="vault-stat-icon" style={{ background: 'rgba(80, 70, 229, 0.1)', color: '#5046e5' }}>
                            <Package size={20} />
                        </div>
                        <div className="vault-stat-info">
                            <span className="vault-stat-value">{pagination.totalCount}</span>
                            <span className="vault-stat-label">Total Products</span>
                        </div>
                    </div>
                    <div className="vault-stat-item">
                        <div className="vault-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                            <Shield size={20} />
                        </div>
                        <div className="vault-stat-info">
                            <span className="vault-stat-value">
                                {products.filter(p => {
                                    const days = Math.ceil((new Date(p.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days > 0;
                                }).length}
                            </span>
                            <span className="vault-stat-label">Protected</span>
                        </div>
                    </div>
                    <div className="vault-stat-item">
                        <div className="vault-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                            <Clock size={20} />
                        </div>
                        <div className="vault-stat-info">
                            <span className="vault-stat-value">
                                {products.filter(p => {
                                    const days = Math.ceil((new Date(p.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days > 0 && days <= 30;
                                }).length}
                            </span>
                            <span className="vault-stat-label">Expiring Soon</span>
                        </div>
                    </div>
                    <div className="vault-stat-item">
                        <div className="vault-stat-icon" style={{ background: 'rgba(248, 113, 113, 0.1)', color: '#f87171' }}>
                            <AlertCircle size={20} />
                        </div>
                        <div className="vault-stat-info">
                            <span className="vault-stat-value">
                                {products.filter(p => {
                                    const days = Math.ceil((new Date(p.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    return days <= 0;
                                }).length}
                            </span>
                            <span className="vault-stat-label">Expired</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="vault-toolbar user-animate-in user-animate-in-2">
                    <div className="vault-toolbar-left">
                        <div className="vault-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search products, serial numbers..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button className="vault-search-clear" onClick={() => setSearch('')}>
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            className={`vault-filter-btn ${filterOpen ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
                            onClick={() => setFilterOpen(!filterOpen)}
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                            {hasActiveFilters && <span className="filter-badge" />}
                        </button>
                    </div>
                    <div className="vault-toolbar-right">
                        <div className="vault-view-toggle">
                            <button
                                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                            >
                                <List size={16} />
                            </button>
                        </div>
                        <button className="vault-add-btn" onClick={handleCreate}>
                            <Plus size={18} />
                            <span>Add Product</span>
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {filterOpen && (
                    <div className="vault-filter-panel user-animate-in">
                        <div className="filter-panel-row">
                            {/* Category */}
                            <div className="filter-group">
                                <label>Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => handleFilterChange(setCategory, e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Warranty Status */}
                            <div className="filter-group">
                                <label>Warranty Status</label>
                                <div className="filter-tabs">
                                    {WARRANTY_TABS.map((tab) => (
                                        <button
                                            key={tab.key}
                                            className={`filter-tab ${warrantyStatus === tab.key ? 'active' : ''}`}
                                            onClick={() => handleFilterChange(setWarrantyStatus, tab.key)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Price Range */}
                            <div className="filter-group">
                                <label>Price Range</label>
                                <div className="filter-price-range">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => handleFilterChange(setMinPrice, e.target.value)}
                                        min="0"
                                    />
                                    <span className="price-separator">—</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => handleFilterChange(setMaxPrice, e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>

                            {/* Sort */}
                            <div className="filter-group">
                                <label>Sort By</label>
                                <div className="filter-sort-row">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value);
                                            setPagination((prev) => ({ ...prev, page: 1 }));
                                        }}
                                    >
                                        {SORT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <button className="sort-dir-btn" onClick={toggleSortOrder} title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
                                        <ArrowUpDown size={16} />
                                        <span>{sortOrder === 'asc' ? 'A→Z' : 'Z→A'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {hasActiveFilters && (
                            <div className="filter-panel-actions">
                                <button className="filter-clear-btn" onClick={clearFilters}>
                                    <X size={14} />
                                    Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Product List */}
                {loading ? (
                    <div className="vault-loading user-animate-in">
                        <div className="vault-loading-spinner" />
                        <span>Loading your vault...</span>
                    </div>
                ) : products.length === 0 ? (
                    <div className="vault-empty user-animate-in user-animate-in-3">
                        <div className="vault-empty-icon">
                            <Package size={48} />
                        </div>
                        <h3>{(search || hasActiveFilters) ? 'No products match your filters' : 'Your vault is empty'}</h3>
                        <p>
                            {(search || hasActiveFilters)
                                ? 'Try adjusting your search or filters.'
                                : 'Add your first product to start tracking warranties.'}
                        </p>
                        {(search || hasActiveFilters) ? (
                            <button className="vault-add-btn" onClick={() => { setSearch(''); clearFilters(); }}>
                                Clear Filters
                            </button>
                        ) : (
                            <button className="vault-add-btn" onClick={handleCreate}>
                                <Plus size={18} />
                                <span>Add Your First Product</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`vault-products-grid ${viewMode}`}>
                            {products.map((product, index) => {
                                const warranty = getWarrantyStatus(product.warrantyExpiry);
                                const WarrantyIcon = warranty.icon;
                                return (
                                    <div
                                        key={product.id}
                                        className="vault-product-card user-animate-in"
                                        style={{ animationDelay: `${0.15 + index * 0.05}s`, opacity: 0 }}
                                    >
                                        <div className="vault-card-header">
                                            <div className="vault-card-emoji">
                                                {getProductEmoji(product.category)}
                                            </div>
                                            <div className="vault-card-actions">
                                                <button
                                                    className="vault-action-btn"
                                                    onClick={() => handleEdit(product)}
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                {deleteConfirm === product.id ? (
                                                    <div className="vault-delete-confirm">
                                                        <button className="confirm-yes" onClick={() => handleDelete(product.id)}>Yes</button>
                                                        <button className="confirm-no" onClick={() => setDeleteConfirm(null)}>No</button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        className="vault-action-btn delete"
                                                        onClick={() => setDeleteConfirm(product.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="vault-card-body">
                                            <div className="vault-card-title-row">
                                                <h3 className="vault-card-title">{product.name}</h3>
                                                <span className={`vault-warranty-badge ${warranty.className}`}>
                                                    <WarrantyIcon size={10} />
                                                    {warranty.label}
                                                </span>
                                            </div>

                                            <div className="vault-card-tags">
                                                {product.brand && (
                                                    <span className="vault-tag">{product.brand}</span>
                                                )}
                                                {product.category && (
                                                    <span className="vault-tag">{product.category}</span>
                                                )}
                                            </div>

                                            <div className="vault-card-details">
                                                {product.serialNumber && (
                                                    <div className="vault-detail-row">
                                                        <span className="vault-detail-label">Serial</span>
                                                        <span className="vault-detail-value">{product.serialNumber}</span>
                                                    </div>
                                                )}
                                                <div className="vault-detail-row">
                                                    <span className="vault-detail-label">Purchased</span>
                                                    <span className="vault-detail-value">{formatDate(product.purchaseDate)}</span>
                                                </div>
                                                {product.purchasePrice > 0 && (
                                                    <div className="vault-detail-row">
                                                        <span className="vault-detail-label">Value</span>
                                                        <span className="vault-detail-value vault-price">
                                                            ${product.purchasePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {product.warrantyExpiry && (
                                            <div className="vault-card-footer">
                                                <div className="vault-warranty-progress">
                                                    <div className="vault-progress-label">
                                                        <span>Warranty Coverage</span>
                                                        <span className={warranty.className}>
                                                            {warranty.label}
                                                        </span>
                                                    </div>
                                                    <div className="vault-progress-bar">
                                                        <div
                                                            className={`vault-progress-fill ${warranty.className}`}
                                                            style={{
                                                                width: `${Math.max(0, Math.min(100,
                                                                    ((new Date(product.warrantyExpiry).getTime() - Date.now()) /
                                                                    (365 * 24 * 60 * 60 * 1000)) * 100
                                                                ))}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="vault-pagination user-animate-in">
                                <span className="pagination-info">
                                    Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                                </span>
                                <div className="pagination-controls">
                                    <button
                                        className="pagination-btn"
                                        disabled={pagination.page <= 1}
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                        .filter((p) => {
                                            // Show first, last, current, and neighbors
                                            return p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1;
                                        })
                                        .reduce<(number | string)[]>((acc, p, i, arr) => {
                                            if (i > 0 && typeof arr[i - 1] === 'number' && p - (arr[i - 1] as number) > 1) {
                                                acc.push('...');
                                            }
                                            acc.push(p);
                                            return acc;
                                        }, [])
                                        .map((item, idx) => (
                                            typeof item === 'string' ? (
                                                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                                            ) : (
                                                <button
                                                    key={item}
                                                    className={`pagination-btn page ${pagination.page === item ? 'active' : ''}`}
                                                    onClick={() => setPagination((prev) => ({ ...prev, page: item as number }))}
                                                >
                                                    {item}
                                                </button>
                                            )
                                        ))}
                                    <button
                                        className="pagination-btn"
                                        disabled={pagination.page >= pagination.totalPages}
                                        onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <ProductModal
                    product={editProduct}
                    onSave={handleSave}
                    onClose={() => {
                        setModalOpen(false);
                        setEditProduct(null);
                        setSaveError(null);
                    }}
                    saving={saving}
                    apiError={saveError}
                />
            )}
        </div>
    );
}
