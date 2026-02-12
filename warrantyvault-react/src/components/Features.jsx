export default function Features() {
    return (
        <section className="features" id="features">
            <div className="container">
                <div className="features-header">
                    <span className="section-label">THE ECOSYSTEM</span>
                    <h2 className="section-title">
                        Total warranty intelligence.<br />
                        <span className="accent-muted">Zero compromises.</span>
                    </h2>
                    <p className="section-description">
                        Manage the entire lifecycle of your high-value assets with military-grade precision.
                    </p>
                </div>
                <div className="bento-grid">
                    <div className="bento-card bento-large gradient-purple">
                        <div className="bento-icon">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L4 6V12C4 16.42 7.39 20.44 12 21.5C16.61 20.44 20 16.42 20 12V6L12 2Z" fill="currentColor" />
                            </svg>
                        </div>
                        <h3>Digital Warranty Vault</h3>
                        <p>Store infinite warranties in a single, unbreachable digital ledger. Your assets, secured.</p>
                        <a href="#" className="bento-link">
                            Open Vault
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="bento-card bento-medium">
                        <div className="bento-pattern">
                            <div className="pattern-grid">
                                <span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span>
                                <span></span><span></span><span></span><span></span>
                            </div>
                            <span className="live-badge">LIVE</span>
                        </div>
                        <h3>Authenticity Check</h3>
                        <p>Instant provenance verification via secure QR scanning.</p>
                    </div>
                    <div className="bento-card bento-medium">
                        <div className="ownership-timeline">
                            <div className="timeline-item current">
                                <span className="timeline-dot"></span>
                                <div className="timeline-content">
                                    <strong>Current Owner</strong>
                                    <span>Dec 24, 2023</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <span className="timeline-dot"></span>
                                <div className="timeline-content">
                                    <strong>Transfer</strong>
                                    <span>Sep 12, 2023</span>
                                </div>
                            </div>
                            <div className="timeline-item">
                                <span className="timeline-dot"></span>
                                <div className="timeline-content">
                                    <strong>Minted</strong>
                                    <span>Aug 30, 2023</span>
                                </div>
                            </div>
                        </div>
                        <h3>Ownership Tracking</h3>
                        <p>Full chain of custody timeline.</p>
                    </div>
                    <div className="bento-card bento-small">
                        <div className="bento-icon icon-coral">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </div>
                        <span className="badge-new">New</span>
                        <h4>Instant Alerts</h4>
                        <p>Expiry & recall notifications.</p>
                    </div>
                    <div className="bento-card bento-small">
                        <div className="bento-icon icon-indigo">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" />
                                <path d="M6 21V19C6 17.9391 6.42143 16.9217 7.17157 16.1716C7.92172 15.4214 8.93913 15 10 15H14C15.0609 15 16.0783 15.4214 16.8284 16.1716C17.5786 16.9217 18 17.9391 18 19V21" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h4>Biometric Sign</h4>
                        <p>Immutable sign-off ledger.</p>
                    </div>
                    <div className="bento-card bento-wide dark-card">
                        <div className="manufacturer-content">
                            <h3>For Manufacturers</h3>
                            <p>Seamless integration workflow.</p>
                        </div>
                        <div className="manufacturer-visual">
                            <div className="workflow-dots">
                                <span>CREATE</span>
                                <span>MINT</span>
                                <span>DEPLOY</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
