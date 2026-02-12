import { useState, useRef, useEffect } from 'react';

const faqData = [
    {
        id: 1,
        question: 'How does WarrantyVault protect my data?',
        answer: 'We use bank-level AES-256 encryption for all data at rest and TLS 1.3 for data in transit. Your warranty documents are stored in secure, SOC 2 Type II certified data centers. We never share your data with third parties without your explicit consent.',
    },
    {
        id: 2,
        question: 'Can I transfer warranties when I sell a product?',
        answer: 'Yes! Pro and Enterprise users can seamlessly transfer warranties to new owners. Simply generate a transfer QR code or share link, and the new owner can claim the warranty in seconds. This is especially useful when selling electronics or appliances.',
    },
    {
        id: 3,
        question: 'What types of warranties can I store?',
        answer: 'WarrantyVault supports all types of product warranties including manufacturer warranties, extended warranties, AppleCare, Best Buy Geek Squad protection, and even car warranties. Our AI can automatically extract details from receipts, emails, and warranty cards.',
    },
    {
        id: 4,
        question: 'How do the expiry alerts work?',
        answer: 'We send smart notifications at 90, 30, and 7 days before your warranty expires. You can customize these intervals in your settings. We also alert you about product recalls and suggest when to file claims based on common issues with your products.',
    },
    {
        id: 5,
        question: 'Is there a mobile app available?',
        answer: 'Yes! WarrantyVault is available on iOS and Android. The mobile app includes a receipt scanner that uses your camera to instantly capture and store warranty information. All data syncs seamlessly across your devices.',
    },
    {
        id: 6,
        question: 'Can I cancel my subscription anytime?',
        answer: 'Absolutely. You can cancel your subscription at any time with no cancellation fees. Your data remains accessible for 30 days after cancellation, giving you time to export everything. We also offer a full refund within the first 30 days.',
    },
];

function FAQItem({ item, isActive, onToggle }) {
    const answerRef = useRef(null);

    useEffect(() => {
        if (answerRef.current) {
            answerRef.current.style.maxHeight = isActive
                ? `${answerRef.current.scrollHeight}px`
                : '0';
        }
    }, [isActive]);

    return (
        <div className={`faq-item ${isActive ? 'active' : ''}`}>
            <button
                className="faq-question"
                aria-expanded={isActive}
                onClick={onToggle}
            >
                <span>{item.question}</span>
                <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
            <div className="faq-answer" ref={answerRef}>
                <p>{item.answer}</p>
            </div>
        </div>
    );
}

export default function FAQ() {
    const [activeId, setActiveId] = useState(1);

    const handleToggle = (id) => {
        setActiveId(activeId === id ? null : id);
    };

    return (
        <section className="faq-section" id="faq">
            <div className="container">
                <div className="faq-layout">
                    <div className="faq-header">
                        <span className="section-label">GOT QUESTIONS?</span>
                        <h2 className="section-title">
                            Frequently<br />
                            <span className="accent-italic">asked.</span>
                        </h2>
                        <p className="faq-description">
                            Can't find what you're looking for? Reach out to our support team.
                        </p>
                        <a href="#" className="btn btn-secondary">
                            Contact Support
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="faq-list">
                        {faqData.map((item) => (
                            <FAQItem
                                key={item.id}
                                item={item}
                                isActive={activeId === item.id}
                                onToggle={() => handleToggle(item.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
