import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    const handleScroll = useCallback(() => {
        const scrollY = window.scrollY;

        setIsScrolled(scrollY > 50);

        if (scrollY > 300) {
            setIsHidden(scrollY > lastScrollY);
        } else {
            setIsHidden(false);
        }

        setLastScrollY(scrollY);
    }, [lastScrollY]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setIsMobileMenuOpen(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isMobileMenuOpen]);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const scrollToSection = (e, sectionId) => {
        e.preventDefault();
        const section = document.querySelector(sectionId);
        if (section) {
            const navHeight = 72;
            const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
        closeMobileMenu();
    };

    return (
        <nav
            className={`navbar ${isScrolled ? 'scrolled' : ''}`}
            id="navbar"
            style={{ transform: isHidden ? 'translateY(-100%)' : 'translateY(0)' }}
        >
            <div className="nav-container">
                <a href="#" className="nav-logo">
                    <div className="logo-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L4 6V12C4 16.42 7.39 20.44 12 21.5C16.61 20.44 20 16.42 20 12V6L12 2Z" fill="currentColor" />
                            <path d="M10 13L8 11L7 12L10 15L17 8L16 7L10 13Z" fill="white" />
                        </svg>
                    </div>
                    <span>WarrantyVault</span>
                </a>

                <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <a href="#features" onClick={(e) => scrollToSection(e, '#features')}>Features</a>
                    <a href="#how-it-works" onClick={(e) => scrollToSection(e, '#how-it-works')}>How it Works</a>
                    <a href="#pricing" onClick={(e) => scrollToSection(e, '#pricing')}>Pricing</a>
                    <Link to="/login" className="nav-login">Login</Link>
                    <Link to="/login" className="btn btn-primary btn-nav">Get Started</Link>
                </div>

                <button
                    className={`nav-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                    id="nav-toggle"
                    aria-label="Toggle navigation"
                    onClick={toggleMobileMenu}
                >
                    <span style={{ transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }}></span>
                    <span style={{ opacity: isMobileMenuOpen ? 0 : 1 }}></span>
                    <span style={{ transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }}></span>
                </button>
            </div>
        </nav>
    );
}
