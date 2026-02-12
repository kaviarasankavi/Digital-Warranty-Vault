import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
    const cardRef = useRef(null);
    const heroRef = useRef(null);

    useEffect(() => {
        const hero = heroRef.current;
        const card = cardRef.current;

        if (!hero || !card) return;

        const handleMouseMove = (e) => {
            const rect = hero.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateY = ((x - centerX) / centerX) * 8;
            const rotateX = ((centerY - y) / centerY) * 8;

            card.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
        };

        const handleMouseLeave = () => {
            card.style.transform = 'perspective(1000px) rotateY(-5deg)';
        };

        hero.addEventListener('mousemove', handleMouseMove);
        hero.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            hero.removeEventListener('mousemove', handleMouseMove);
            hero.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section className="hero" ref={heroRef}>
            <div className="hero-container">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Secure your<br />
                        <span className="hero-title-accent">legacy</span><span className="dot">.</span>
                    </h1>
                    <p className="hero-description">
                        Store, verify, and transfer product warranties with a single tap.
                        A digital vault built for the things that matter most, not just the receipt.
                    </p>
                    <div className="hero-actions">
                        <Link to="/login" className="btn btn-primary btn-lg">
                            Start Vaulting
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </Link>
                        <a href="#how-it-works" className="btn btn-ghost">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polygon points="5,3 19,12 5,21" fill="currentColor" />
                            </svg>
                            See how it works
                        </a>
                    </div>
                    <div className="hero-social-proof">
                        <div className="avatar-stack">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" alt="User avatar" />
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="User avatar" />
                            <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop" alt="User avatar" />
                        </div>
                        <div className="social-proof-text">
                            <strong>204+ Items Secured</strong>
                            <span>Trustpilot ★ 4.9/5</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="product-card" ref={cardRef}>
                        <div className="product-image-wrapper">
                            <img src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&h=300&fit=crop" alt="Luxury Watch" className="product-image" />
                            <span className="verified-badge">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 12L11 14L15 10M21 12C21 16.97 17.97 20 12 21C6.03 20 3 16.97 3 12V5L12 2L21 5V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                VERIFIED
                            </span>
                        </div>
                        <div className="product-details">
                            <div className="product-header">
                                <h3>Chronos Elite</h3>
                                <span className="product-id">#8492A</span>
                            </div>
                            <div className="product-meta">
                                <span>Purchased: Oct 2023</span>
                                <span className="separator">•</span>
                                <span>Warranty: Active</span>
                            </div>
                            <div className="warranty-progress">
                                <div className="progress-label">
                                    <span>Warranty Coverage</span>
                                    <span className="progress-value">75% Left</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: '75%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
