import { useState } from 'react';
import type { Product, ProductFormData } from '../../api/productApi';
import { X } from 'lucide-react';
import './Products.css';

const CATEGORIES = [
    'Electronics',
    'Appliances',
    'Computing',
    'Audio',
    'Wearables',
    'Camera & Drones',
    'Gaming',
    'Other',
];

const emptyForm: ProductFormData = {
    name: '',
    brand: '',
    model: '',
    serialNumber: '',
    category: '',
    purchaseDate: '',
    purchasePrice: 0,
    warrantyExpiry: '',
    notes: '',
};

interface Props {
    product?: Product | null;
    onSave: (data: ProductFormData) => void;
    onClose: () => void;
    saving: boolean;
}

export function ProductModal({ product, onSave, onClose, saving }: Props) {
    const [form, setForm] = useState<ProductFormData>(
        product
            ? {
                name: product.name,
                brand: product.brand,
                model: product.model,
                serialNumber: product.serialNumber,
                category: product.category,
                purchaseDate: product.purchaseDate,
                purchasePrice: product.purchasePrice,
                warrantyExpiry: product.warrantyExpiry,
                notes: product.notes,
            }
            : emptyForm
    );

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'purchasePrice' ? parseFloat(value) || 0 : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Product Name *</label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. MacBook Pro M2"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Brand</label>
                            <input
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                                placeholder="e.g. Apple"
                            />
                        </div>

                        <div className="form-group">
                            <label>Model</label>
                            <input
                                name="model"
                                value={form.model}
                                onChange={handleChange}
                                placeholder="e.g. A2779"
                            />
                        </div>

                        <div className="form-group">
                            <label>Serial Number</label>
                            <input
                                name="serialNumber"
                                value={form.serialNumber}
                                onChange={handleChange}
                                placeholder="e.g. C02X12345"
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value="">Select category</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Purchase Date</label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={form.purchaseDate}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Purchase Price ($)</label>
                            <input
                                type="number"
                                name="purchasePrice"
                                value={form.purchasePrice || ''}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Warranty Expiry Date</label>
                            <input
                                type="date"
                                name="warrantyExpiry"
                                value={form.warrantyExpiry}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Notes</label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Any additional details..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={saving}>
                            {saving
                                ? 'Saving...'
                                : product
                                    ? 'Update Product'
                                    : 'Add Product'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
