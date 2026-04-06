import { useState } from 'react';
import { Header } from '../../components/layout/Header';
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
    const [serialInput, setSerialInput] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState<VerifyResult>(null);
    const [verifiedSerial, setVerifiedSerial] = useState('');

    const handleVerify = async () => {
        if (!serialInput.trim()) return;
        setIsVerifying(true);
        setVerifyResult(null);
        setVerifiedSerial(serialInput);

        await new Promise((r) => setTimeout(r, 1800));

        let result: VerifyResult;
        if (serialInput.toLowerCase().includes('fake')) {
            result = 'counterfeit';
        } else if (serialInput.length < 4) {
            result = 'not_found';
        } else {
            result = 'authentic';
        }
        setVerifyResult(result);
        setIsVerifying(false);

        // Log to shared store
        addVerificationCheck({
            id: `CHK-${Date.now().toString(36).toUpperCase()}`,
            serialHash: serialInput,
            productName: result === 'authentic' ? 'Verified Product' : 'Unknown Product',
            vendor: result === 'authentic' ? 'Registry' : '—',
            result: result === 'authentic',
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
                                <p className="portal-subtitle">Enter serial hash or scan QR code to verify</p>
                            </div>
                        </div>

                        <div className="portal-input-row">
                            <div className="portal-input-wrap">
                                <Search size={16} className="portal-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Enter serial hash (SHA-256) or product ID..."
                                    className="portal-serial-input"
                                    value={serialInput}
                                    onChange={(e) => setSerialInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                />
                            </div>
                            <button
                                className={`portal-verify-btn ${isVerifying ? 'portal-verify-loading' : ''}`}
                                onClick={handleVerify}
                                disabled={isVerifying || !serialInput.trim()}
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

                                {verifyResult === 'authentic' && (
                                    <div className="result-authentic">
                                        <div className="result-icon-wrap green">
                                            <CheckCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="result-title">Authentic Product</h3>
                                            <p className="result-serial-shown">{verifiedSerial}</p>
                                            <div className="result-details">
                                                <span>Sony Bravia XR A95L</span>
                                                <span className="result-detail-dot">·</span>
                                                <span>Warranty: Active · 1026 days left</span>
                                            </div>
                                        </div>
                                        <button className="result-cert-btn">
                                            <FileText size={14} />
                                            Certificate
                                        </button>
                                    </div>
                                )}

                                {verifyResult === 'counterfeit' && (
                                    <div className="result-counterfeit">
                                        <div className="result-icon-wrap red">
                                            <XCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="result-title">⚠ Counterfeit Alert</h3>
                                            <p className="result-serial-shown">{verifiedSerial}</p>
                                            <p className="result-warn-text">Signature verification failed. This product may be counterfeit. Fraud report logged.</p>
                                        </div>
                                    </div>
                                )}

                                {verifyResult === 'not_found' && (
                                    <div className="result-not-found">
                                        <div className="result-icon-wrap amber">
                                            <AlertCircle size={28} />
                                        </div>
                                        <div>
                                            <h3 className="result-title">Product Not Found</h3>
                                            <p className="result-serial-shown">{verifiedSerial}</p>
                                            <p className="result-warn-text">No matching serial found in the registry. Check the serial and try again.</p>
                                        </div>
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
                        <span className="history-subtitle">Archival log from Neo4j graph database</span>
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
