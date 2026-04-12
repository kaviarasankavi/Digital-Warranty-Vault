import { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { productApi, Product } from '../../api/productApi';
import {
    Shield,
    Search,
    CheckCircle,
    XCircle,
    AlertCircle,
    QrCode,
    Clock,
    ChevronRight,
    Scan,
    FileText,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import './Verify.css';

type VerifyResult = 'authentic' | 'counterfeit' | 'not_found' | null;

export default function Verify() {
    const verificationChecks = useDataStore((s) => s.verificationChecks);
    const addVerificationCheck = useDataStore((s) => s.addVerificationCheck);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResult>(null);
    const [verifiedProduct, setVerifiedProduct] = useState<Product | null>(null);

    useEffect(() => {
        productApi.getAll().then(res => {
            setProducts(res.data);
            if (res.data.length > 0) {
                setSelectedProductId(String(res.data[0].id));
            }
        }).catch(err => console.error("Failed to fetch products for verify:", err));
    }, []);

    const handleVerify = async () => {
        if (!selectedProductId) return;
        setIsVerifying(true);
        setVerifyResult(null);
        
        const product = products.find(p => String(p.id) === selectedProductId);
        if (!product) {
            setIsVerifying(false);
            return;
        }
        setVerifiedProduct(product);

        await new Promise((r) => setTimeout(r, 1800));

        const result: VerifyResult = 'authentic';
        setVerifyResult(result);
        setIsVerifying(false);

        // Log to shared store
        addVerificationCheck({
            id: `CHK-${Date.now().toString(36).toUpperCase()}`,
            serialHash: product.serialNumber || `SN-${product.id}`,
            productName: product.name,
            vendor: product.brand || '—',
            result: true,
            checkedAt: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase(),
            ownerName: '—',
            ipAddress: '127.0.0.1',
        });
    };

    const stats = {
        total: verificationChecks.length,
        authentic: verificationChecks.filter((h) => h.result).length,
        flagged: verificationChecks.filter((h) => !h.result).length,
    };

    return (
        <div className="verify-page">
            <Header title="Authenticity Verification" />

            <div className="verify-content">
                {/* Top Section: Verification Portal + Stats */}
                <div className="verify-top-grid">
                    {/* Verification Portal */}
                    <div className="verify-portal-card">
                        <div className="portal-header">
                            <Shield size={22} className="portal-shield-icon" />
                            <div>
                                <h2 className="portal-title">Authenticity Portal</h2>
                                <p className="portal-subtitle">Select a product from your vault to trace and verify securely</p>
                            </div>
                        </div>

                        <div className="portal-input-row">
                            <div className="portal-input-wrap">
                                <Search size={16} className="portal-search-icon" />
                                <select 
                                    className="portal-serial-input"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    style={{ appearance: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
                                >
                                    {products.length === 0 && <option value="">No products in vault</option>}
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} - {p.serialNumber || `ID: ${p.id}`}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className={`portal-verify-btn ${isVerifying ? 'portal-verify-loading' : ''}`}
                                onClick={handleVerify}
                                disabled={isVerifying || !selectedProductId}
                            >
                                {isVerifying ? (
                                    <>
                                        <div className="verify-spinner" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <Scan size={16} />
                                        Verify
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="portal-or-divider">
                            <span className="or-line" />
                            <span className="or-text">or scan QR code</span>
                            <span className="or-line" />
                        </div>

                        <button className="portal-qr-btn">
                            <QrCode size={18} />
                            <span>Open QR Scanner</span>
                        </button>

                        {/* Result area */}
                        {(verifyResult || isVerifying) && (
                            <div className={`verify-result-card ${verifyResult ? `result-${verifyResult}` : 'result-loading'}`}>
                                {isVerifying && (
                                    <div className="result-loading-state">
                                        <div className="verify-spinner large" />
                                        <p>Querying MongoDB + Neo4j databases...</p>
                                    </div>
                                )}

                                {verifyResult === 'authentic' && verifiedProduct && (
                                    <div className="result-authentic">
                                        <div className="result-icon-wrap green">
                                            <CheckCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="result-title">Authentic Product</h3>
                                            <p className="result-serial-shown">{verifiedProduct.serialNumber}</p>
                                            <div className="result-details">
                                                <span>{verifiedProduct.name}</span>
                                                <span className="result-detail-dot">·</span>
                                                <span>Warranty Expiry: {verifiedProduct.warrantyExpiry ? new Date(verifiedProduct.warrantyExpiry).toLocaleDateString() : 'N/A'}</span>
                                            </div>
                                        </div>
                                        <button className="result-cert-btn">
                                            <FileText size={14} />
                                            Certificate
                                        </button>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="verify-stats-column">
                        <div className="verify-stat-card vstat-total">
                            <div className="vstat-icon">
                                <Shield size={18} />
                            </div>
                            <div className="vstat-number">{stats.total}</div>
                            <div className="vstat-label">Total Checks</div>
                        </div>
                        <div className="verify-stat-card vstat-authentic">
                            <div className="vstat-icon green">
                                <CheckCircle size={18} />
                            </div>
                            <div className="vstat-number">{stats.authentic}</div>
                            <div className="vstat-label">Authentic</div>
                        </div>
                        <div className="verify-stat-card vstat-flagged">
                            <div className="vstat-icon red">
                                <XCircle size={18} />
                            </div>
                            <div className="vstat-number">{stats.flagged}</div>
                            <div className="vstat-label">Flagged</div>
                        </div>
                    </div>
                </div>

                {/* Check History */}
                <div className="check-history-section">
                    <div className="history-header">
                        <div className="history-title-row">
                            <Clock size={18} />
                            <h3 className="history-title">Verification History</h3>
                        </div>
                    </div>

                    <div className="history-list">
                        {verificationChecks.map((check) => (
                            <div
                                key={check.id}
                                className={`history-entry ${check.result ? 'history-authentic' : 'history-failed'}`}
                            >
                                <div className={`history-result-dot ${check.result ? 'dot-authentic' : 'dot-failed'}`}>
                                    {check.result
                                        ? <CheckCircle size={14} />
                                        : <XCircle size={14} />
                                    }
                                </div>

                                <div className="history-info">
                                    <div className="history-product-row">
                                        <span className="history-product">{check.productName}</span>
                                        {check.vendor !== '—' && (
                                            <span className="history-vendor">· {check.vendor}</span>
                                        )}
                                    </div>
                                    <div className="history-meta-row">
                                        <span className="history-check-id">{check.id}</span>
                                        <span className="history-hash">{check.serialHash}</span>
                                    </div>
                                </div>

                                <div className="history-right">
                                    <div className="history-time">{check.checkedAt}</div>
                                    {check.ownerName !== '—' && (
                                        <div className="history-owner">{check.ownerName}</div>
                                    )}
                                    <button className="history-view-btn">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
