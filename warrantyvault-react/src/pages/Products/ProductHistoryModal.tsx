import React, { useEffect, useState } from 'react';
import { X, Clock, Edit2, Plus, DollarSign, ArrowRight } from 'lucide-react';
import api from '../../api/axios';
import './ProductHistoryModal.css';

interface HistoryRecord {
    event_type: 'AUDIT' | 'PRICE_CHANGE';
    action: string;
    timestamp: string;
    old_data?: any;
    new_data?: any;
    old_price?: string | number;
    new_price?: string | number;
}

interface ProductHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number | null;
    productName: string;
}

export const ProductHistoryModal: React.FC<ProductHistoryModalProps> = ({
    isOpen,
    onClose,
    productId,
    productName,
}) => {
    const [history, setHistory] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !productId) return;

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get(`/products/${productId}/history`);
                setHistory(response.data.data);
            } catch (err: any) {
                setError(err.friendlyMessage || 'Failed to load product history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [isOpen, productId]);

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCurrency = (value: number | string | undefined) => {
        if (value === undefined || value === null) return '$0.00';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(num);
    };

    const renderAuditChanges = (oldData: any, newData: any) => {
        if (!oldData || !newData) return null;

        const changes: { field: string; oldVal: string; newVal: string }[] = [];
        const skipFields = ['updatedAt', 'createdAt'];

        Object.keys(newData).forEach(key => {
            if (skipFields.includes(key)) return;
            const hasChanged = JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]);
            
            // Exclude purchasePrice changes if there's a separate PRICE_CHANGE event for it
            // usually they trigger around the same time. We'll still show it here for completeness 
            // unless it's too redundant. Let's just show all raw changes.
            if (hasChanged) {
                changes.push({
                    field: key,
                    oldVal: String(oldData[key] || 'None'),
                    newVal: String(newData[key] || 'None')
                });
            }
        });

        if (changes.length === 0) return <div className="timeline-body">No tracked fields were modified.</div>;

        return (
            <div className="changes-list">
                {changes.map((c, i) => (
                    <div key={i} className="change-item">
                        <span className="change-field">{c.field}</span>
                        <div className="change-diff">
                            <span className="change-old">{c.oldVal}</span>
                            <ArrowRight size={14} className="change-arrow-small" />
                            <span className="change-new">{c.newVal}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="product-history-modal-overlay" onClick={onClose}>
            <div className="product-history-modal-content" onClick={e => e.stopPropagation()}>
                <div className="product-history-header">
                    <h2><Clock size={20} /> History: {productName}</h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="product-history-body">
                    {loading ? (
                        <div className="history-loading">
                            Loading timeline...
                        </div>
                    ) : error ? (
                        <div className="history-empty">
                            <p className="text-red-400">{error}</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="history-empty">
                            <Clock size={48} />
                            <p>No history recorded for this product yet.</p>
                        </div>
                    ) : (
                        <div className="timeline">
                            {history.map((record, index) => {
                                let icon;
                                let title;
                                let itemClass;

                                if (record.event_type === 'PRICE_CHANGE') {
                                    icon = <DollarSign size={14} />;
                                    title = 'Price Changed';
                                    itemClass = 'type-price';
                                } else if (record.action === 'INSERT') {
                                    icon = <Plus size={14} />;
                                    title = 'Product Created';
                                    itemClass = 'type-insert';
                                } else {
                                    icon = <Edit2 size={14} />;
                                    title = 'Product Updated';
                                    itemClass = 'type-update';
                                }

                                return (
                                    <div key={`${record.event_type}-${record.timestamp}-${index}`} className={`timeline-item ${itemClass}`}>
                                        <div className="timeline-marker">
                                            {icon}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-header">
                                                <span className="timeline-title">{title}</span>
                                                <span className="timeline-date">{formatDate(record.timestamp)}</span>
                                            </div>
                                            
                                            {record.event_type === 'PRICE_CHANGE' && (
                                                <div className="price-change-grid">
                                                    <div className="price-box">
                                                        <span className="price-label">Old Price</span>
                                                        <span className="price-value drop">{formatCurrency(record.old_price)}</span>
                                                    </div>
                                                    <ArrowRight size={18} className="change-arrow" />
                                                    <div className="price-box">
                                                        <span className="price-label">New Price</span>
                                                        <span className={`price-value ${parseFloat(String(record.new_price)) > parseFloat(String(record.old_price)) ? 'rise' : 'drop'}`}>
                                                            {formatCurrency(record.new_price)}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {record.event_type === 'AUDIT' && record.action === 'UPDATE' && (
                                                renderAuditChanges(record.old_data, record.new_data)
                                            )}

                                            {record.event_type === 'AUDIT' && record.action === 'INSERT' && (
                                                <div className="timeline-body">
                                                    Initial registration in vault.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
