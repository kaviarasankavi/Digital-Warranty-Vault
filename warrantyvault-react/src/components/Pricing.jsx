import { useState } from 'react';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        icon: '🛡️',
        tagline: 'Perfect for individuals',
        monthlyPrice: 0,
        yearlyPrice: 0,
        priceNote: 'Free forever',
        features: [
            { text: 'Up to 10 warranties', included: true },
            { text: 'Basic QR scanning', included: true },
            { text: 'Email notifications', included: true },
            { text: 'AI receipt scanning', included: false },
            { text: 'Priority support', included: false },
        ],
        buttonText: 'Get Started Free',
        buttonVariant: 'outline',
    },
    {
        id: 'pro',
        name: 'Pro',
        icon: '⚡',
        tagline: 'Best for power users',
        monthlyPrice: 9,
        yearlyPrice: 7,
        popular: true,
        features: [
            { text: 'Unlimited warranties', included: true },
            { text: 'AI receipt scanning', included: true },
            { text: 'Smart expiry alerts', included: true },
            { text: 'Warranty transfer', included: true },
            { text: 'Priority support', included: true },
        ],
        buttonText: 'Start Free Trial',
        buttonVariant: 'primary',
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        icon: '🏢',
        tagline: 'For teams & businesses',
        monthlyPrice: 49,
        yearlyPrice: 39,
        features: [
            { text: 'Everything in Pro', included: true },
            { text: 'Team collaboration', included: true },
            { text: 'API access', included: true },
            { text: 'Custom integrations', included: true },
            { text: 'Dedicated account manager', included: true },
        ],
        buttonText: 'Contact Sales',
        buttonVariant: 'outline',
    },
];

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(false);

    const togglePricing = () => {
        setIsYearly(!isYearly);
    };

    return (
        <section className="pricing-section" id="pricing">
            <div className="container">
                <div className="pricing-header">
                    <span className="section-label">TRANSPARENT PRICING</span>
                    <h2 className="section-title">
                        Simple plans,<br />
                        <span className="accent-italic">powerful protection.</span>
                    </h2>
                    <p className="section-description">
                        Choose the plan that fits your needs. Upgrade or downgrade anytime.
                    </p>
                    <div className="pricing-toggle">
                        <span
                            className={`toggle-label ${!isYearly ? 'active' : ''}`}
                            data-period="monthly"
                            onClick={() => setIsYearly(false)}
                        >
                            Monthly
                        </span>
                        <button
                            className={`toggle-switch ${isYearly ? 'active' : ''}`}
                            id="pricing-toggle"
                            aria-label="Toggle billing period"
                            onClick={togglePricing}
                        >
                            <span className="toggle-knob"></span>
                        </button>
                        <span
                            className={`toggle-label ${isYearly ? 'active' : ''}`}
                            data-period="yearly"
                            onClick={() => setIsYearly(true)}
                        >
                            Yearly
                            <span className="save-badge">Save 20%</span>
                        </span>
                    </div>
                </div>

                <div className="pricing-grid">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.popular && <div className="popular-badge">Most Popular</div>}
                            <div className="pricing-card-header">
                                <span className="plan-icon">{plan.icon}</span>
                                <h3 className="plan-name">{plan.name}</h3>
                                <p className="plan-tagline">{plan.tagline}</p>
                            </div>
                            <div className="pricing-card-body">
                                <div className="price">
                                    <span className="currency">$</span>
                                    <span
                                        className="amount"
                                        style={{
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                    </span>
                                    <span className="period">/month</span>
                                </div>
                                <p className="price-note">
                                    {plan.priceNote || `Billed ${isYearly ? 'yearly' : 'monthly'}`}
                                </p>
                                <ul className="features-list">
                                    {plan.features.map((feature, index) => (
                                        <li key={index} className={feature.included ? '' : 'disabled'}>
                                            {feature.included ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            )}
                                            {feature.text}
                                        </li>
                                    ))}
                                </ul>
                                <a
                                    href="#"
                                    className={`btn btn-block ${plan.buttonVariant === 'primary' ? 'btn-primary' : 'btn-outline-dark'}`}
                                >
                                    {plan.buttonText}
                                </a>
                            </div>
                        </div>
                    ))}
                </div>

                <p className="pricing-guarantee">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L4 6V12C4 16.42 7.39 20.44 12 21.5C16.61 20.44 20 16.42 20 12V6L12 2Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    30-day money-back guarantee • No credit card required for free plan
                </p>
            </div>
        </section>
    );
}
