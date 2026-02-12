// ============================================
// WarrantyVault Landing Page JavaScript
// Handles navigation, animations, and interactivity
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    initNavigation();
    initScrollAnimations();
    initLiveCounter();
    initMobileMenu();
    initPricingToggle();
    initFAQAccordion();
    initGalleryEffects();
    initScrollProgress();
});

// ============================================
// Navigation Scroll Effect
// ============================================
function initNavigation() {
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavbar = () => {
        const scrollY = window.scrollY;

        // Add scrolled class for background effect
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll
        if (scrollY > 300) {
            if (scrollY > lastScrollY && !navbar.classList.contains('nav-hidden')) {
                navbar.style.transform = 'translateY(-100%)';
            } else if (scrollY < lastScrollY) {
                navbar.style.transform = 'translateY(0)';
            }
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollY = scrollY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    });
}

// ============================================
// Mobile Menu Toggle
// ============================================
function initMobileMenu() {
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            navLinks.classList.toggle('mobile-open');

            // Animate hamburger to X
            const spans = toggle.querySelectorAll('span');
            if (toggle.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when clicking a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                navLinks.classList.remove('mobile-open');
                const spans = toggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
                toggle.classList.remove('active');
                navLinks.classList.remove('mobile-open');
                const spans = toggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }
}

// ============================================
// Scroll Animations (Intersection Observer)
// ============================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');

                // Trigger specific animations
                if (entry.target.classList.contains('progress-fill')) {
                    const width = entry.target.style.width || '75%';
                    entry.target.style.width = '0';
                    setTimeout(() => {
                        entry.target.style.width = width;
                    }, 100);
                }

                // Unobserve after animation
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const animatedElements = document.querySelectorAll(`
        .hero-content,
        .hero-visual,
        .problem-content,
        .problem-visual,
        .step-indicator,
        .scanner-visual,
        .warranty-card-preview,
        .bento-card,
        .stats-content,
        .stat-card,
        .testimonial-main,
        .testimonial-card,
        .cta-container,
        .progress-fill,
        .pricing-card,
        .gallery-item,
        .faq-item
    `);

    animatedElements.forEach((el, index) => {
        el.classList.add('animate-ready');
        el.style.transitionDelay = `${index * 0.05}s`;
        observer.observe(el);
    });

    // Add CSS for animations
    addAnimationStyles();
}

function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .animate-ready {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        
        .animate-in {
            opacity: 1;
            transform: translateY(0);
        }
        
        .nav-links.mobile-open {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(20px);
            padding: 1.5rem;
            gap: 1rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 768px) {
            .nav-links.mobile-open {
                display: flex !important;
            }
        }
        
        .pricing-card.animate-ready,
        .gallery-item.animate-ready,
        .faq-item.animate-ready {
            transform: translateY(20px) scale(0.98);
        }
        
        .pricing-card.animate-in,
        .gallery-item.animate-in,
        .faq-item.animate-in {
            transform: translateY(0) scale(1);
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// Live Counter Animation
// ============================================
function initLiveCounter() {
    const counter = document.getElementById('live-counter');
    if (!counter) return;

    const target = 247000;
    let current = 0;
    const duration = 2000;
    let startTime = null;

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startTime = Date.now();
                animateCounter();
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    observer.observe(counter);

    function animateCounter() {
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out)
            const eased = 1 - Math.pow(1 - progress, 3);

            current = Math.floor(target * eased);
            counter.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Add random increments for "live" effect
                startLiveUpdates();
            }
        };
        animate();
    }

    function startLiveUpdates() {
        setInterval(() => {
            const currentValue = parseInt(counter.textContent.replace(/,/g, ''));
            const increment = Math.floor(Math.random() * 5) + 1;
            counter.textContent = (currentValue + increment).toLocaleString();
        }, 3000 + Math.random() * 2000);
    }
}

// ============================================
// Pricing Toggle (Monthly/Yearly)
// ============================================
function initPricingToggle() {
    const toggle = document.getElementById('pricing-toggle');
    if (!toggle) return;

    const monthlyLabel = document.querySelector('.toggle-label[data-period="monthly"]');
    const yearlyLabel = document.querySelector('.toggle-label[data-period="yearly"]');
    const amounts = document.querySelectorAll('.amount');
    const billingPeriods = document.querySelectorAll('.billing-period');

    let isYearly = false;

    toggle.addEventListener('click', () => {
        isYearly = !isYearly;
        toggle.classList.toggle('active', isYearly);

        // Update labels
        monthlyLabel.classList.toggle('active', !isYearly);
        yearlyLabel.classList.toggle('active', isYearly);

        // Animate price change
        amounts.forEach(amount => {
            const monthly = amount.dataset.monthly;
            const yearly = amount.dataset.yearly;
            const newValue = isYearly ? yearly : monthly;

            // Add animation
            amount.style.transform = 'translateY(-10px)';
            amount.style.opacity = '0';

            setTimeout(() => {
                amount.textContent = newValue;
                amount.style.transform = 'translateY(10px)';

                setTimeout(() => {
                    amount.style.transform = 'translateY(0)';
                    amount.style.opacity = '1';
                }, 50);
            }, 150);
        });

        // Update billing period text
        billingPeriods.forEach(period => {
            period.textContent = isYearly ? 'yearly' : 'monthly';
        });
    });

    // Allow clicking on labels to toggle
    [monthlyLabel, yearlyLabel].forEach(label => {
        label.addEventListener('click', () => {
            const targetPeriod = label.dataset.period;
            if ((targetPeriod === 'yearly' && !isYearly) || (targetPeriod === 'monthly' && isYearly)) {
                toggle.click();
            }
        });
    });
}

// ============================================
// FAQ Accordion
// ============================================
function initFAQAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current item
            item.classList.toggle('active', !isActive);
            question.setAttribute('aria-expanded', !isActive);

            // Smooth height animation
            if (!isActive) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0';
            }
        });

        // Set initial state
        if (item.classList.contains('active')) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
        }
    });
}

// ============================================
// Gallery Effects
// ============================================
function initGalleryEffects() {
    const galleryItems = document.querySelectorAll('.gallery-item');

    galleryItems.forEach(item => {
        const image = item.querySelector('img');

        // Lazy load animation
        if (image) {
            image.addEventListener('load', () => {
                image.style.opacity = '1';
            });

            // If already loaded
            if (image.complete) {
                image.style.opacity = '1';
            }
        }

        // 3D tilt effect on hover
        item.addEventListener('mousemove', (e) => {
            const rect = item.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            item.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            item.style.transition = 'transform 0.5s ease';
        });

        item.addEventListener('mouseenter', () => {
            item.style.transition = 'transform 0.1s ease';
        });
    });
}

// ============================================
// Scroll Progress Indicator
// ============================================
function initScrollProgress() {
    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.prepend(progressBar);

    window.addEventListener('scroll', () => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = (window.scrollY / scrollHeight) * 100;
        progressBar.style.width = `${scrollProgress}%`;
    });
}

// ============================================
// Smooth Scroll for Anchor Links
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const navHeight = document.getElementById('navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// Form Handling
// ============================================
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        // Simple validation
        if (email && email.includes('@')) {
            // Show success message
            const button = newsletterForm.querySelector('button');
            const originalText = button.innerHTML;
            button.innerHTML = '✓ Subscribed!';
            button.style.background = '#10b981';

            // Reset after 3 seconds
            setTimeout(() => {
                button.innerHTML = originalText;
                button.style.background = '';
                newsletterForm.reset();
            }, 3000);
        }
    });
}

// ============================================
// Product Card Parallax Effect
// ============================================
const productCard = document.querySelector('.product-card');
if (productCard) {
    const hero = document.querySelector('.hero');

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateY = ((x - centerX) / centerX) * 8;
        const rotateX = ((centerY - y) / centerY) * 8;

        productCard.style.transform = `perspective(1000px) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
    });

    // Reset on mouse leave
    hero.addEventListener('mouseleave', () => {
        productCard.style.transform = 'perspective(1000px) rotateY(-5deg)';
    });
}

// ============================================
// Typing Effect for Hero Title (Optional)
// ============================================
function typeEffect(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    const type = () => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };

    type();
}

// ============================================
// Add Dynamic Current Year to Footer
// ============================================
const yearElement = document.querySelector('.footer-bottom p');
if (yearElement) {
    const text = yearElement.textContent;
    yearElement.textContent = text.replace('2024', new Date().getFullYear());
}

// ============================================
// Preloader (Optional)
// ============================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// ============================================
// Keyboard Navigation for Accessibility
// ============================================
document.addEventListener('keydown', (e) => {
    // Tab through pricing cards
    if (e.key === 'Tab') {
        const activeElement = document.activeElement;
        if (activeElement.closest('.pricing-card')) {
            activeElement.closest('.pricing-card').classList.add('focused');
        }
    }
});

// ============================================
// Button Click Ripple Effect
// ============================================
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.className = 'btn-ripple';
        ripple.style.cssText = `
            position: absolute;
            background: rgba(255,255,255,0.3);
            border-radius: 50%;
            pointer-events: none;
            width: 100px;
            height: 100px;
            left: ${x - 50}px;
            top: ${y - 50}px;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
        `;

        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple animation CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .btn {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(rippleStyle);
