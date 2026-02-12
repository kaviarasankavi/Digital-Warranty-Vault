export default function HowItWorks() {
    return (
        <section className="how-it-works" id="how-it-works">
            <div className="container">
                <div className="how-it-works-content">
                    <div className="step-indicator">
                        <span className="step-number">01</span>
                        <h2 className="step-title">Capture<br />& Secure</h2>
                        <p className="step-description">
                            Snap a photo of your receipt. Our AI instantly extracts the SKU, date, and price, locking it into the vault.
                        </p>
                        <a href="#" className="step-link">
                            START SCANNING
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="scanner-visual">
                        <div className="scanner-frame">
                            <div className="scanner-line"></div>
                            <div className="scanner-corners">
                                <span></span><span></span><span></span><span></span>
                            </div>
                        </div>
                    </div>
                    <div className="warranty-card-preview">
                        <div className="preview-header">
                            <div className="preview-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L4 6V12C4 16.42 7.39 20.44 12 21.5C16.61 20.44 20 16.42 20 12V6L12 2Z" fill="currentColor" />
                                </svg>
                            </div>
                            <div>
                                <h4>WARRANTY</h4>
                                <span>VERIFIED ASSET</span>
                            </div>
                        </div>
                        <div className="preview-details">
                            <div className="detail-item">
                                <span>Product</span>
                                <strong>Sony WH-1000XM5</strong>
                            </div>
                            <div className="detail-item">
                                <span>Expires</span>
                                <strong>Dec 2026</strong>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="progress-steps">
                    <div className="progress-line"></div>
                    <div className="progress-step active">
                        <span className="step-dot"></span>
                        <span className="step-label">CAPTURE</span>
                    </div>
                    <div className="progress-step">
                        <span className="step-dot"></span>
                        <span className="step-label">MINT</span>
                    </div>
                    <div className="progress-step">
                        <span className="step-dot"></span>
                        <span className="step-label">CLAIM</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
