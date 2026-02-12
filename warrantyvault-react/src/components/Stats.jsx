import { useState, useEffect, useRef } from 'react';

export default function Stats() {
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const counterRef = useRef(null);
    const target = 247000;

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);
                        animateCounter();
                    }
                });
            },
            { threshold: 0.5 }
        );

        if (counterRef.current) {
            observer.observe(counterRef.current);
        }

        return () => observer.disconnect();
    }, [hasAnimated]);

    const animateCounter = () => {
        const duration = 2000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const currentCount = Math.floor(target * eased);

            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Start live updates
                startLiveUpdates();
            }
        };

        animate();
    };

    const startLiveUpdates = () => {
        setInterval(() => {
            setCount((prev) => prev + Math.floor(Math.random() * 5) + 1);
        }, 3000 + Math.random() * 2000);
    };

    return (
        <section className="stats-section">
            <div className="container">
                <div className="stats-grid">
                    <div className="stats-content">
                        <h2 className="stats-title">
                            Protection<br />
                            <span className="accent-muted">at Scale.</span>
                        </h2>
                        <p className="stats-description">
                            WarrantyVault redefines asset protection through precision engineering and algorithmic transparency. We don't just store warranties; we validate them in real-time.
                        </p>
                        <a href="#" className="stats-link">
                            View Documentation
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="stats-cards">
                        <div className="stat-card stat-primary">
                            <div className="stat-header">
                                <span className="live-counter">Live Counter</span>
                                <div className="stat-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2L4 6V12C4 16.42 7.39 20.44 12 21.5C16.61 20.44 20 16.42 20 12V6L12 2Z" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                            <p className="stat-label">Active Warranties Secured</p>
                            <div className="stat-number" id="live-counter" ref={counterRef}>
                                {count.toLocaleString()}
                            </div>
                        </div>
                        <div className="stat-card-group">
                            <div className="stat-card stat-secondary">
                                <div className="stat-header-inline">
                                    <h4>Claim Accuracy</h4>
                                    <span className="stat-change positive">↗ +0.02%</span>
                                </div>
                                <p className="stat-sublabel">Algorithmic validation engine</p>
                                <div className="accuracy-gauge">
                                    <svg viewBox="0 0 100 50">
                                        <path className="gauge-bg" d="M10,50 A40,40 0 0,1 90,50" />
                                        <path className="gauge-fill" d="M10,50 A40,40 0 0,1 90,50" strokeDasharray="125" strokeDashoffset="2" />
                                    </svg>
                                    <span className="gauge-value">99.8%</span>
                                </div>
                            </div>
                            <div className="stat-card stat-tertiary">
                                <div className="stat-icon-small">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
                                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <div className="stat-info">
                                    <strong>45s</strong>
                                    <span>Avg. Processing</span>
                                    <p>Instant claim interaction via automated validation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="trusted-by">
                    <span className="trusted-label">TRUSTED BY INDUSTRY LEADERS</span>
                    <div className="trusted-logos">
                        <span className="logo-placeholder">★ HexaSure</span>
                        <span className="logo-placeholder">◯ Vortex</span>
                        <span className="logo-placeholder">△ Pinnacle</span>
                        <span className="logo-placeholder">◇ ShieldAI</span>
                        <span className="logo-placeholder">○ Flow</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
