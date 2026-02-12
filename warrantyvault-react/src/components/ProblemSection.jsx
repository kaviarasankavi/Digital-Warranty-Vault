export default function ProblemSection() {
    return (
        <section className="problem-section" id="problem">
            <div className="container">
                <div className="problem-grid">
                    <div className="problem-content">
                        <span className="section-label">FIG. 2.1 — THE PROBLEM</span>
                        <h2 className="section-title">
                            The Warranty<br />
                            <span className="accent-italic">Chaos.</span>
                        </h2>
                        <p className="problem-description">
                            <strong>Paper fades. Receipts get lost. Deadlines pass.</strong>
                        </p>
                        <p className="problem-text">
                            Stop digging through kitchen drawers. The old way of managing product protection is broken, messy, and costing you money. We've built the vault to stop the bleeding.
                        </p>
                        <a href="#" className="btn btn-secondary">
                            Organize Your Vault
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="problem-visual">
                        <div className="chaos-illustration">
                            <div className="folder-card">
                                <span className="folder-label">UNSORTED_2022</span>
                                <div className="folder-icon">📁</div>
                                <span className="chaos-note">total mess</span>
                            </div>
                            <div className="solution-card">
                                <div className="solution-header">
                                    <div className="solution-icon">📷</div>
                                    <div className="solution-info">
                                        <h4>Sony Alpha a7 III</h4>
                                        <span>S/N: 48291C1-K</span>
                                    </div>
                                    <span className="status-badge active">ACTIVE</span>
                                </div>
                                <div className="solution-image">
                                    <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=150&fit=crop" alt="Camera" />
                                </div>
                                <div className="solution-footer">
                                    <div className="expires">
                                        <span>EXPIRES</span>
                                        <strong>Oct 24, 2025</strong>
                                    </div>
                                    <a href="#">View Details</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
