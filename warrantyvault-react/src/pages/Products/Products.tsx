import { useState, useEffect, useCallback } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    Search,
    Calendar,
    DollarSign,
} from 'lucide-react';
import { Header } from '../../components/layout/Header';
import { productApi, type Product, type ProductFormData } from '../../api/productApi';
import { ProductModal } from './ProductModal';
import './Products.css';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editProduct, setEditProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await productApi.getAll();
            setProducts(res.data);
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleCreate = () => {
        setEditProduct(null);
        setModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setEditProduct(product);
        setModalOpen(true);
    };

    const handleSave = async (data: ProductFormData) => {
        try {
            setSaving(true);
            if (editProduct) {
                await productApi.update(editProduct.id, data);
            } else {
                await productApi.create(data);
            }
            setModalOpen(false);
            setEditProduct(null);
            await fetchProducts();
        } catch (err) {
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

    const filtered = products.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand.toLowerCase().includes(search.toLowerCase()) ||
            p.serialNumber.toLowerCase().includes(search.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getWarrantyStatus = (expiry: string) => {
        if (!expiry) return { label: 'Unknown', className: 'status-unknown' };
        const days = Math.ceil(
            (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (days < 0) return { label: 'Expired', className: 'status-expired' };
        if (days <= 30) return { label: `${days}d left`, className: 'status-warning' };
        return { label: 'Active', className: 'status-active' };
    };

    return (
        <div className="products-page dark-dashboard">
            <Header title="My Vault" />

            <div className="products-content">
                {/* Toolbar */}
                <div className="products-toolbar">
                    <div className="products-search">
                        <Search size={16} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button className="add-product-btn" onClick={handleCreate}>
                        <Plus size={18} />
                        <span>Add Product</span>
                    </button>
                </div>

                {/* Product List */}
                {loading ? (
                    <div className="products-loading">
                        <div className="loader-spinner" />
                        <span>Loading products...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="products-empty">
                        <div className="empty-icon">
                            <Package size={48} />
                        </div>
                        <h3>
                            {search
                                ? 'No products match your search'
                                : 'No products yet'}
                        </h3>
                        <p>
                            {search
                                ? 'Try a different search term.'
                                : 'Add your first product to start tracking warranties.'}
                        </p>
                        {!search && (
                            <button className="add-product-btn" onClick={handleCreate}>
                                <Plus size={18} />
                                <span>Add Product</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="products-grid">
                        {filtered.map((product) => {
                            const warranty = getWarrantyStatus(product.warrantyExpiry);
                            return (
                                <div key={product.id} className="product-card">
                                    <div className="product-card-header">
                                        <div className="product-card-title">
                                            <h3>{product.name}</h3>
                                            <span className={`warranty-status ${warranty.className}`}>
                                                {warranty.label}
                                            </span>
                                        </div>
                                        <div className="product-card-actions">
                                            <button
                                                className="icon-btn"
                                                onClick={() => handleEdit(product)}
                                                title="Edit"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            {deleteConfirm === product.id ? (
                                                <div className="delete-confirm">
                                                    <button
                                                        className="confirm-yes"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        Yes
                                                    </button>
                                                    <button
                                                        className="confirm-no"
                                                        onClick={() => setDeleteConfirm(null)}
                                                    >
                                                        No
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="icon-btn delete"
                                                    onClick={() => setDeleteConfirm(product.id)}
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="product-card-meta">
                                        {product.brand && (
                                            <span className="meta-tag">{product.brand}</span>
                                        )}
                                        {product.category && (
                                            <span className="meta-tag">{product.category}</span>
                                        )}
                                    </div>

                                    <div className="product-card-details">
                                        {product.serialNumber && (
                                            <div className="detail-row">
                                                <span className="detail-label">Serial</span>
                                                <span className="detail-value">
                                                    {product.serialNumber}
                                                </span>
                                            </div>
                                        )}
                                        <div className="detail-row">
                                            <Calendar size={13} />
                                            <span className="detail-value">
                                                {formatDate(product.purchaseDate)}
                                            </span>
                                        </div>
                                        {product.purchasePrice > 0 && (
                                            <div className="detail-row">
                                                <DollarSign size={13} />
                                                <span className="detail-value">
                                                    ${product.purchasePrice.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {product.warrantyExpiry && (
                                        <div className="product-card-expiry">
                                            Warranty expires{' '}
                                            {formatDate(product.warrantyExpiry)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
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
                    }}
                    saving={saving}
                />
            )}
        </div>
    );
}
