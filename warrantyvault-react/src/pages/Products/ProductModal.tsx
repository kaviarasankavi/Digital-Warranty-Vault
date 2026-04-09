import { useState } from 'react';
import type { Product, ProductFormData } from '../../api/productApi';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';
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

interface FormErrors {
    name?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    category?: string;
    purchaseDate?: string;
    purchasePrice?: string;
    warrantyExpiry?: string;
    notes?: string;
}

interface Props {
    product?: Product | null;
    onSave: (data: ProductFormData) => void;
    onClose: () => void;
    saving: boolean;
    apiError?: string | null;
}

export function ProductModal({ product, onSave, onClose, saving, apiError }: Props) {
    const [form, setForm] = useState<ProductFormData>(
        product
            ? {
                name: product.name,
                brand: product.brand,
                model: product.model,
                serialNumber: product.serialNumber,
                category: product.category,
                purchaseDate: product.purchaseDate ? product.purchaseDate.split('T')[0] : '',
                purchasePrice: product.purchasePrice,
                warrantyExpiry: product.warrantyExpiry ? product.warrantyExpiry.split('T')[0] : '',
                notes: product.notes,
            }
            : emptyForm
    );
    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === 'purchasePrice' ? parseFloat(value) || 0 : value,
        }));
        // Clear individual field error on change
        if (errors[name as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        // Product Name: required, min 2 chars
        if (!form.name || !form.name.trim()) {
            newErrors.name = 'Product name is required.';
        } else if (form.name.trim().length < 2) {
            newErrors.name = 'Product name must be at least 2 characters.';
        } else if (form.name.trim().length > 100) {
            newErrors.name = 'Product name must not exceed 100 characters.';
        }

        // Brand: required, max 50 chars
        if (!form.brand || !form.brand.trim()) {
            newErrors.brand = 'Brand is required.';
        } else if (form.brand.trim().length > 50) {
            newErrors.brand = 'Brand must not exceed 50 characters.';
        }

        // Model: required, max 50 chars
        if (!form.model || !form.model.trim()) {
            newErrors.model = 'Model is required.';
        } else if (form.model.trim().length > 50) {
            newErrors.model = 'Model must not exceed 50 characters.';
        }

        // Serial Number: optional but max 100 chars, no special chars
        if (form.serialNumber && form.serialNumber.trim()) {
            if (form.serialNumber.trim().length > 100) {
                newErrors.serialNumber = 'Serial number must not exceed 100 characters.';
            } else if (!/^[a-zA-Z0-9\-_.]+$/.test(form.serialNumber.trim())) {
                newErrors.serialNumber = 'Serial number can only contain letters, numbers, hyphens, dots, or underscores.';
            }
        }

        // Purchase Price: must be non-negative
        if (form.purchasePrice !== undefined && form.purchasePrice !== null) {
            const price = Number(form.purchasePrice);
            if (isNaN(price) || price < 0) {
                newErrors.purchasePrice = 'Purchase price must be a valid non-negative number.';
            } else if (price > 10000000) {
                newErrors.purchasePrice = 'Purchase price seems too large. Please verify.';
            }
        }

        // Date validations
        if (form.purchaseDate && form.warrantyExpiry) {
            const pd = new Date(form.purchaseDate);
            const we = new Date(form.warrantyExpiry);
            if (!isNaN(pd.getTime()) && !isNaN(we.getTime()) && we < pd) {
                newErrors.warrantyExpiry = 'Warranty expiry date cannot be before the purchase date.';
            }
        }

        // Notes: max 500 chars
        if (form.notes && form.notes.length > 500) {
            newErrors.notes = 'Notes must not exceed 500 characters.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        onSave(form);
    };

    const hasErrors = Object.keys(errors).length > 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* API / Server Error Banner */}
                {apiError && (
                    <div className="modal-api-error">
                        <AlertTriangle size={16} />
                        <span>{apiError}</span>
                    </div>
                )}

                {/* General validation error summary (if multiple errors) */}
                {hasErrors && (
                    <div className="modal-validation-summary">
                        <AlertCircle size={14} />
                        <span>Please fix the errors below before submitting.</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="modal-form" noValidate>
                    <div className="form-grid">
                        {/* Product Name */}
                        <div className={`form-group full-width ${errors.name ? 'has-error' : ''}`}>
                            <label>Product Name <span className="required-star">*</span></label>
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="e.g. MacBook Pro M2"
                                className={errors.name ? 'input-error' : ''}
                            />
                            {errors.name && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.name}
                                </span>
                            )}
                        </div>

                        {/* Brand */}
                        <div className={`form-group ${errors.brand ? 'has-error' : ''}`}>
                            <label>Brand <span className="required-star">*</span></label>
                            <input
                                name="brand"
                                value={form.brand}
                                onChange={handleChange}
                                placeholder="e.g. Apple"
                                className={errors.brand ? 'input-error' : ''}
                            />
                            {errors.brand && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.brand}
                                </span>
                            )}
                        </div>

                        {/* Model */}
                        <div className={`form-group ${errors.model ? 'has-error' : ''}`}>
                            <label>Model <span className="required-star">*</span></label>
                            <input
                                name="model"
                                value={form.model}
                                onChange={handleChange}
                                placeholder="e.g. A2779"
                                className={errors.model ? 'input-error' : ''}
                            />
                            {errors.model && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.model}
                                </span>
                            )}
                        </div>

                        {/* Serial Number */}
                        <div className={`form-group ${errors.serialNumber ? 'has-error' : ''}`}>
                            <label>Serial Number</label>
                            <input
                                name="serialNumber"
                                value={form.serialNumber}
                                onChange={handleChange}
                                placeholder="e.g. C02X12345"
                                className={errors.serialNumber ? 'input-error' : ''}
                            />
                            {errors.serialNumber && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.serialNumber}
                                </span>
                            )}
                        </div>

                        {/* Category */}
                        <div className={`form-group ${errors.category ? 'has-error' : ''}`}>
                            <label>Category</label>
                            <select
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                className={errors.category ? 'input-error' : ''}
                            >
                                <option value="">Select category</option>
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                            {errors.category && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.category}
                                </span>
                            )}
                        </div>

                        {/* Purchase Date */}
                        <div className={`form-group ${errors.purchaseDate ? 'has-error' : ''}`}>
                            <label>Purchase Date</label>
                            <input
                                type="date"
                                name="purchaseDate"
                                value={form.purchaseDate}
                                onChange={handleChange}
                                className={errors.purchaseDate ? 'input-error' : ''}
                            />
                            {errors.purchaseDate && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.purchaseDate}
                                </span>
                            )}
                        </div>

                        {/* Purchase Price */}
                        <div className={`form-group ${errors.purchasePrice ? 'has-error' : ''}`}>
                            <label>Purchase Price ($)</label>
                            <input
                                type="number"
                                name="purchasePrice"
                                value={form.purchasePrice || ''}
                                onChange={handleChange}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={errors.purchasePrice ? 'input-error' : ''}
                            />
                            {errors.purchasePrice && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.purchasePrice}
                                </span>
                            )}
                        </div>

                        {/* Warranty Expiry Date */}
                        <div className={`form-group full-width ${errors.warrantyExpiry ? 'has-error' : ''}`}>
                            <label>Warranty Expiry Date</label>
                            <input
                                type="date"
                                name="warrantyExpiry"
                                value={form.warrantyExpiry}
                                onChange={handleChange}
                                className={errors.warrantyExpiry ? 'input-error' : ''}
                            />
                            {errors.warrantyExpiry && (
                                <span className="field-error-msg">
                                    <AlertCircle size={12} /> {errors.warrantyExpiry}
                                </span>
                            )}
                        </div>

                        {/* Notes */}
                        <div className={`form-group full-width ${errors.notes ? 'has-error' : ''}`}>
                            <label>Notes</label>
                            <textarea
                                name="notes"
                                value={form.notes}
                                onChange={handleChange}
                                placeholder="Any additional details..."
                                rows={3}
                                className={errors.notes ? 'input-error' : ''}
                            />
                            <div className="field-footer-row">
                                {errors.notes ? (
                                    <span className="field-error-msg">
                                        <AlertCircle size={12} /> {errors.notes}
                                    </span>
                                ) : (
                                    <span />
                                )}
                                <span className={`char-counter ${form.notes && form.notes.length > 450 ? 'char-counter-warn' : ''}`}>
                                    {form.notes?.length || 0}/500
                                </span>
                            </div>
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
