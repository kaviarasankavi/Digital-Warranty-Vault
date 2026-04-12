/**
 * VendorProducts.tsx
 *
 * Products page rendered inside the Vendor portal layout.
 * Wraps the full product management logic (same backend API + modals)
 * but inside the vendor dark theme container so the sidebar never changes.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Plus, Pencil, Trash2, Package, Search, Shield,
    Filter, Grid, List, CheckCircle, AlertCircle,
    Clock, ChevronLeft, ChevronRight, X, ArrowUpDown,
} from 'lucide-react';
import { productApi, type Product, type ProductFormData, type ProductQueryParams, type Pagination } from '../../api/productApi';
import { ProductModal } from '../Products/ProductModal';
import { ProductHistoryModal } from '../Products/ProductHistoryModal';
import './VendorProducts.css';

const WARRANTY_TABS = [
    { key: '',              label: 'All' },
    { key: 'active',        label: 'Active' },
    { key: 'expiring_soon', label: 'Expiring Soon' },
    { key: 'expired',       label: 'Expired' },
];

const SORT_OPTIONS = [
    { value: 'createdAt',     label: 'Date Added' },
    { value: 'name',          label: 'Name' },
    { value: 'purchasePrice', label: 'Price' },
    { value: 'purchaseDate',  label: 'Purchase Date' },
    { value: 'warrantyExpiry',label: 'Warranty Expiry' },
];

export default function VendorProducts() {
    const [products,       setProducts]       = useState<Product[]>([]);
    const [loading,        setLoading]        = useState(true);
    const [modalOpen,      setModalOpen]      = useState(false);
    const [editProduct,    setEditProduct]    = useState<Product | null>(null);
    const [saving,         setSaving]         = useState(false);
    const [saveError,      setSaveError]      = useState<string | null>(null);
    const [deleteConfirm,  setDeleteConfirm]  = useState<number | null>(null);
    const [viewMode,       setViewMode]       = useState<'grid' | 'list'>('grid');
    const [historyOpen,    setHistoryOpen]    = useState(false);
    const [historyId,      setHistoryId]      = useState<number | null>(null);
    const [historyName,    setHistoryName]    = useState('');
    const [search,         setSearch]         = useState('');
    const [debouncedSearch,setDebouncedSearch]= useState('');
    const [filterOpen,     setFilterOpen]     = useState(false);
    const [category,       setCategory]       = useState('');
    const [warrantyStatus, setWarrantyStatus] = useState('');
    const [minPrice,       setMinPrice]       = useState('');
    const [maxPrice,       setMaxPrice]       = useState('');
    const [sortBy,         setSortBy]         = useState('createdAt');
    const [sortOrder,      setSortOrder]      = useState<'asc'|'desc'>('desc');
    const [categories,     setCategories]     = useState<string[]>([]);
    const [pagination,     setPagination]     = useState<Pagination>({ page:1, limit:12, totalCount:0, totalPages:0 });
    const debounceTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

    useEffect(() => {
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(p => ({ ...p, page: 1 }));
        }, 300);
        return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
    }, [search]);

    useEffect(() => {
        productApi.getCategories().then(r => setCategories(r.data)).catch(() => {});
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const params: ProductQueryParams = { page: pagination.page, limit: pagination.limit, sortBy, sortOrder };
            if (debouncedSearch) params.search = debouncedSearch;
            if (category)       params.category = category;
            if (warrantyStatus) params.warrantyStatus = warrantyStatus;
            if (minPrice)       params.minPrice = parseFloat(minPrice);
            if (maxPrice)       params.maxPrice = parseFloat(maxPrice);
            const res = await productApi.getAll(params);
            setProducts(res.data);
            setPagination(res.pagination);
        } catch (err: any) {
            if (err?.response?.status !== 401) setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, category, warrantyStatus, minPrice, maxPrice, sortBy, sortOrder, pagination.page, pagination.limit]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const handleCreate = () => { setEditProduct(null); setSaveError(null); setModalOpen(true); };
    const handleEdit   = (p: Product) => { setEditProduct(p); setSaveError(null); setModalOpen(true); };
    const handleHistory= (p: Product) => { setHistoryId(p.id); setHistoryName(p.name); setHistoryOpen(true); };

    const handleSave = async (data: ProductFormData) => {
        try {
            setSaving(true); setSaveError(null);
            if (editProduct) await productApi.update(editProduct.id, data);
            else             await productApi.create(data);
            setModalOpen(false); setEditProduct(null);
            await fetchProducts();
            productApi.getCategories().then(r => setCategories(r.data)).catch(() => {});
        } catch (err: any) {
            setSaveError(err?.response?.data?.message || err?.message || 'Unexpected error.');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id: number) => {
        try { await productApi.delete(id); setDeleteConfirm(null); await fetchProducts(); }
        catch (err) { console.error(err); }
    };

    const handleFilter = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
        setter(val); setPagination(p => ({ ...p, page: 1 }));
    };

    const clearFilters = () => {
        setCategory(''); setWarrantyStatus(''); setMinPrice(''); setMaxPrice('');
        setSortBy('createdAt'); setSortOrder('desc'); setPagination(p => ({ ...p, page: 1 }));
    };

    const hasFilters = category || warrantyStatus || minPrice || maxPrice || sortBy !== 'createdAt' || sortOrder !== 'desc';

    const getWarrantyMeta = (expiry: string) => {
        if (!expiry) return { label: 'No Warranty', cls: 'vp-badge-none',    Icon: AlertCircle };
        const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
        if (days < 0)  return { label: 'Expired',        cls: 'vp-badge-exp',    Icon: AlertCircle };
        if (days <= 30) return { label: `${days}d left`, cls: 'vp-badge-warn',   Icon: Clock };
        return             { label: 'Active',          cls: 'vp-badge-active', Icon: CheckCircle };
    };

    const emoji = (cat: string) => ({ Electronics:'💻', Appliances:'🔌', Audio:'🎧', Camera:'📷',
        Phone:'📱', Watch:'⌚', Drone:'🚁', Gaming:'🎮', Computing:'🖥️', Wearables:'⌚',
        'Camera & Drones':'📷' }[cat] ?? '📦');

    return (
        <div className="vp-page">
            {/* ── Page Header ── */}
            <div className="vd-page-header">
                <div>
                    <h1 className="vd-page-title">My <span className="vd-title-accent">Products</span></h1>
                    <p className="vd-page-sub">Manage your product catalog and warranty coverage</p>
                </div>
                <button className="vd-btn-primary" onClick={handleCreate}>
                    <Plus size={15} /> Add Product
                </button>
            </div>

            {/* ── Stat Bar ── */}
            <div className="vp-stats-row">
                {[
                    { icon: Package,      color: 'teal',  val: pagination.totalCount,
                      label: 'Total' },
                    { icon: Shield,       color: 'green', label: 'Protected',
                      val: products.filter(p => Math.ceil((new Date(p.warrantyExpiry).getTime()-Date.now())/86400000) > 0).length },
                    { icon: Clock,        color: 'amber', label: 'Expiring Soon',
                      val: products.filter(p => { const d=Math.ceil((new Date(p.warrantyExpiry).getTime()-Date.now())/86400000); return d>0&&d<=30; }).length },
                    { icon: AlertCircle,  color: 'coral', label: 'Expired',
                      val: products.filter(p => Math.ceil((new Date(p.warrantyExpiry).getTime()-Date.now())/86400000) <= 0).length },
                ].map(({ icon: Icon, color, val, label }) => (
                    <div key={label} className="vp-stat-item">
                        <div className={`vp-stat-icon vp-icon-${color}`}><Icon size={18} /></div>
                        <div><span className="vp-stat-val">{val}</span><span className="vp-stat-label">{label}</span></div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="vp-toolbar">
                <div className="vp-toolbar-left">
                    <div className="vp-search">
                        <Search size={15} />
                        <input placeholder="Search products, serial numbers…" value={search}
                            onChange={e => setSearch(e.target.value)} />
                        {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
                    </div>
                    <button className={`vp-filter-btn ${filterOpen ? 'open' : ''} ${hasFilters ? 'has-filters' : ''}`}
                        onClick={() => setFilterOpen(!filterOpen)}>
                        <Filter size={15} /> Filter {hasFilters && <span className="vp-filter-dot" />}
                    </button>
                </div>
                <div className="vp-toolbar-right">
                    <div className="vp-view-toggle">
                        <button className={viewMode==='grid'?'active':''} onClick={() => setViewMode('grid')}><Grid size={15} /></button>
                        <button className={viewMode==='list'?'active':''} onClick={() => setViewMode('list')}><List size={15} /></button>
                    </div>
                </div>
            </div>

            {/* ── Filter Panel ── */}
            {filterOpen && (
                <div className="vp-filter-panel">
                    <div className="vp-filter-row">
                        <div className="vp-filter-group">
                            <label>Category</label>
                            <select value={category} onChange={e => handleFilter(setCategory, e.target.value)}>
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="vp-filter-group">
                            <label>Warranty Status</label>
                            <div className="vp-filter-tabs">
                                {WARRANTY_TABS.map(t => (
                                    <button key={t.key} className={warrantyStatus===t.key?'active':''}
                                        onClick={() => handleFilter(setWarrantyStatus, t.key)}>{t.label}</button>
                                ))}
                            </div>
                        </div>
                        <div className="vp-filter-group">
                            <label>Price Range</label>
                            <div className="vp-price-range">
                                <input type="number" placeholder="Min" value={minPrice} min="0"
                                    onChange={e => handleFilter(setMinPrice, e.target.value)} />
                                <span>—</span>
                                <input type="number" placeholder="Max" value={maxPrice} min="0"
                                    onChange={e => handleFilter(setMaxPrice, e.target.value)} />
                            </div>
                        </div>
                        <div className="vp-filter-group">
                            <label>Sort By</label>
                            <div className="vp-sort-row">
                                <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPagination(p=>({...p,page:1})); }}>
                                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <button className="vp-sort-dir" onClick={() => { setSortOrder(s=>s==='asc'?'desc':'asc'); setPagination(p=>({...p,page:1})); }}>
                                    <ArrowUpDown size={14} /> {sortOrder==='asc'?'A→Z':'Z→A'}
                                </button>
                            </div>
                        </div>
                    </div>
                    {hasFilters && (
                        <div className="vp-filter-actions">
                            <button className="vp-clear-btn" onClick={clearFilters}><X size={13} /> Clear All</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Product Grid ── */}
            {loading ? (
                <div className="vp-loading"><div className="vp-spinner" /><span>Loading products…</span></div>
            ) : products.length === 0 ? (
                <div className="vp-empty">
                    <div className="vp-empty-icon"><Package size={44} /></div>
                    <h3>{(search||hasFilters) ? 'No products match your filters' : 'No products yet'}</h3>
                    <p>{(search||hasFilters) ? 'Try adjusting your search or filters.' : 'Add your first product to start tracking warranties.'}</p>
                    {(search||hasFilters) ? (
                        <button className="vd-btn-primary" onClick={() => { setSearch(''); clearFilters(); }}>Clear Filters</button>
                    ) : (
                        <button className="vd-btn-primary" onClick={handleCreate}><Plus size={15} /> Add Product</button>
                    )}
                </div>
            ) : (
                <>
                    <div className={`vp-grid ${viewMode}`}>
                        {products.map((p, i) => {
                            const w = getWarrantyMeta(p.warrantyExpiry);
                            const WIcon = w.Icon;
                            return (
                                <div key={p.id} className="vp-card" style={{ animationDelay:`${0.05*i}s` }}>
                                    <div className="vp-card-top">
                                        <div className="vp-card-emoji">{emoji(p.category)}</div>
                                        <div className="vp-card-actions">
                                            <button onClick={() => handleHistory(p)} title="History"><Clock size={13} /></button>
                                            <button onClick={() => handleEdit(p)} title="Edit"><Pencil size={13} /></button>
                                            {deleteConfirm === p.id ? (
                                                <div className="vp-delete-confirm">
                                                    <button className="yes" onClick={() => handleDelete(p.id)}>Yes</button>
                                                    <button className="no"  onClick={() => setDeleteConfirm(null)}>No</button>
                                                </div>
                                            ) : (
                                                <button className="del" onClick={() => setDeleteConfirm(p.id)} title="Delete"><Trash2 size={13} /></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="vp-card-body">
                                        <div className="vp-card-title-row">
                                            <h3>{p.name}</h3>
                                            <span className={`vp-warranty-badge ${w.cls}`}><WIcon size={9} />{w.label}</span>
                                        </div>
                                        <div className="vp-card-tags">
                                            {p.brand    && <span>{p.brand}</span>}
                                            {p.category && <span>{p.category}</span>}
                                        </div>
                                        <div className="vp-card-details">
                                            {p.serialNumber && <div className="vp-detail-row"><span>Serial</span><span>{p.serialNumber}</span></div>}
                                            <div className="vp-detail-row"><span>Purchased</span><span>{new Date(p.purchaseDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'})}</span></div>
                                            {p.purchasePrice > 0 && <div className="vp-detail-row"><span>Value</span><span className="vp-price">${p.purchasePrice.toLocaleString('en-US',{minimumFractionDigits:2})}</span></div>}
                                        </div>
                                    </div>
                                    {p.warrantyExpiry && (
                                        <div className="vp-card-footer">
                                            <div className="vp-progress-label">
                                                <span>Warranty Coverage</span>
                                                <span className={w.cls}>{w.label}</span>
                                            </div>
                                            <div className="vp-progress-track">
                                                <div className={`vp-progress-fill ${w.cls}`}
                                                    style={{ width:`${Math.max(0,Math.min(100,((new Date(p.warrantyExpiry).getTime()-Date.now())/(365*86400000))*100))}%` }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="vp-pagination">
                            <span>Showing {(pagination.page-1)*pagination.limit+1}–{Math.min(pagination.page*pagination.limit,pagination.totalCount)} of {pagination.totalCount}</span>
                            <div className="vp-pagination-ctrl">
                                <button disabled={pagination.page<=1} onClick={() => setPagination(p=>({...p,page:p.page-1}))}><ChevronLeft size={15} /></button>
                                {Array.from({length:pagination.totalPages},(_,i)=>i+1)
                                    .filter(n=>n===1||n===pagination.totalPages||Math.abs(n-pagination.page)<=1)
                                    .reduce<(number|string)[]>((acc,n,i,arr)=>{
                                        if(i>0&&typeof arr[i-1]==='number'&&n-(arr[i-1] as number)>1) acc.push('…');
                                        acc.push(n); return acc;
                                    },[])
                                    .map((item,idx)=>typeof item==='string'
                                        ? <span key={`e${idx}`} className="vp-ellipsis">…</span>
                                        : <button key={item} className={pagination.page===item?'active':''} onClick={()=>setPagination(p=>({...p,page:item as number}))}>{item}</button>
                                    )}
                                <button disabled={pagination.page>=pagination.totalPages} onClick={() => setPagination(p=>({...p,page:p.page+1}))}><ChevronRight size={15} /></button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {modalOpen && (
                <ProductModal product={editProduct} onSave={handleSave} saving={saving} apiError={saveError}
                    onClose={() => { setModalOpen(false); setEditProduct(null); setSaveError(null); }} />
            )}
            <ProductHistoryModal isOpen={historyOpen} productId={historyId} productName={historyName}
                onClose={() => { setHistoryOpen(false); setHistoryId(null); setHistoryName(''); }} />
        </div>
    );
}
