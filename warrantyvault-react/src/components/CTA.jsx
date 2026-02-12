export default function CTA() {
    return (
        <section className="cta-section">
            <div className="cta-container">
                <span className="cta-label">◈ SECURE YOUR WORLD</span>
                <h2 className="cta-title">
                    Ready to protect<br />
                    <span className="accent-italic">what matters?</span>
                </h2>
                <p className="cta-description">
                    Join over <strong>50,000 users</strong> securing their electronics with WarrantyVault. Instant claims processing, zero hassle, complete peace of mind.
                </p>
                <div className="cta-actions">
                    <a href="#" className="btn btn-coral btn-lg">
                        Start Free Trial
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </a>
                    <a href="#" className="btn btn-outline-light btn-lg">View Plans</a>
                </div>
                <div className="cta-features">
                    <span>✓ Instant Approval</span>
                    <span>◈ Bank-Level Security</span>
                    <span>✕ Cancel Anytime</span>
                </div>
            </div>
        </section>
    );
}
