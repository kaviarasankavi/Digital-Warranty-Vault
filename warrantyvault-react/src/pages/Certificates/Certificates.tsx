import { useState, useEffect } from 'react';
import {
    Award, Download, CheckCircle, Calendar,
    Package, RefreshCw, Shield, Info, Loader2,
} from 'lucide-react';
import { certificateApi, Certificate } from '../../api/certificateApi';
import './Certificates.css';

const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

const VENDOR_NAME: Record<string, string> = {
    'vendor@samsung.vault':     'Samsung Electronics',
    'vendor@dell.vault':        'Dell Technologies',
    'vendor@jbl.vault':         'JBL (Harman International)',
    'vendor@firebolt.vault':    'FireBolt Technologies',
    'vendor@sony.vault':        'Sony Corporation',
    'vendor@lg.vault':          'LG Electronics',
    'vendor@apple.vault':       'Apple Inc.',
    'vendor@warrantyvault.com': 'WarrantyVault',
};

export default function Certificates() {
    const [certs,       setCerts]       = useState<Certificate[]>([]);
    const [loading,     setLoading]     = useState(true);
    const [refreshing,  setRefreshing]  = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [dlError,     setDlError]     = useState<string | null>(null);

    const load = async (silent = false) => {
        if (!silent) setLoading(true); else setRefreshing(true);
        try { setCerts(await certificateApi.getMyCertificates()); }
        catch (e) { console.error(e); }
        finally { setLoading(false); setRefreshing(false); }
    };

    useEffect(() => { load(); }, []);

    const handleDownload = async (cert: Certificate) => {
        setDlError(null);
        setDownloading(cert._id);
        try {
            const safeName = cert.productName.replace(/[^a-z0-9]/gi, '_');
            await certificateApi.download(cert._id, `WarrantyVault_Cert_${safeName}_${cert.certificateId}.pdf`);
        } catch (e: any) {
            setDlError(`Download failed: ${e?.response?.data?.message ?? 'Please try again.'}`);
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div className="cert-page">
            {/* Header */}
            <div className="cert-header">
                <div>
                    <h2 className="cert-title">My Certificates</h2>
                    <p className="cert-sub">Download vendor-issued authenticity certificates for your verified products</p>
                </div>
                <button className={`cert-refresh ${refreshing ? 'cert-spinning' : ''}`} onClick={() => load(true)}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* How it works */}
            {!loading && certs.length === 0 && (
                <div className="cert-how">
                    <div className="cert-how-title"><Info size={14} />How to get a certificate</div>
                    <div className="cert-how-steps">
                        {[
                            { n: '1', text: 'Go to Verify and request authenticity verification for a product' },
                            { n: '2', text: 'The brand vendor reviews and approves the verification request' },
                            { n: '3', text: 'A digital certificate is automatically generated and appears here' },
                            { n: '4', text: 'Download the PDF certificate anytime as proof of authenticity' },
                        ].map(s => (
                            <div key={s.n} className="cert-step">
                                <div className="cert-step-n">{s.n}</div>
                                <p>{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dlError && (
                <div className="cert-error">{dlError}</div>
            )}

            {loading ? (
                <div className="cert-loading"><div className="cert-spinner" />Loading certificates…</div>
            ) : certs.length === 0 ? (
                <div className="cert-empty">
                    <div className="cert-empty-icon"><Award size={36} /></div>
                    <h3>No certificates yet</h3>
                    <p>Once a vendor verifies your product, your certificate will appear here.</p>
                </div>
            ) : (
                <>
                    <div className="cert-count">
                        <Shield size={13} /> {certs.length} certificate{certs.length !== 1 ? 's' : ''} issued
                    </div>
                    <div className="cert-grid">
                        {certs.map(cert => (
                            <div key={cert._id} className="cert-card">
                                {/* Gold seal */}
                                <div className="cert-seal">
                                    <Award size={22} />
                                    <span>Verified</span>
                                </div>

                                {/* Card body */}
                                <div className="cert-card-body">
                                    <div className="cert-product-name">{cert.productName}</div>
                                    <div className="cert-brand">{cert.brand.toUpperCase()}</div>

                                    <div className="cert-details">
                                        {cert.serialNumber && (
                                            <div className="cert-detail">
                                                <Package size={11} />
                                                <span>S/N: <strong>{cert.serialNumber}</strong></span>
                                            </div>
                                        )}
                                        <div className="cert-detail">
                                            <CheckCircle size={11} />
                                            <span>Verified by <strong>{VENDOR_NAME[cert.vendorEmail] ?? cert.brand}</strong></span>
                                        </div>
                                        <div className="cert-detail">
                                            <Calendar size={11} />
                                            <span>Verified on <strong>{fmtDate(cert.verifiedAt)}</strong></span>
                                        </div>
                                        <div className="cert-detail">
                                            <Calendar size={11} />
                                            <span>Issued <strong>{fmtDate(cert.issuedAt)}</strong></span>
                                        </div>
                                    </div>

                                    {cert.vendorNote && (
                                        <div className="cert-note">"{cert.vendorNote}"</div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="cert-card-footer">
                                    <div className="cert-id">
                                        <Shield size={10} /> {cert.certificateId}
                                    </div>
                                    <button
                                        className="cert-download-btn"
                                        onClick={() => handleDownload(cert)}
                                        disabled={downloading === cert._id}
                                    >
                                        {downloading === cert._id ? (
                                            <><Loader2 size={13} className="cert-dl-spin" />Generating…</>
                                        ) : (
                                            <><Download size={13} />Download PDF</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
