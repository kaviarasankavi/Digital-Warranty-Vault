import { useRef, useEffect } from 'react';

const galleryItems = [
    {
        id: 1,
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&h=400&fit=crop',
        alt: 'Smart Watch',
        category: 'Electronics',
        title: 'Apple Watch Ultra',
        description: 'Protected since 2023',
        size: 'large',
    },
    {
        id: 2,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        alt: 'Headphones',
        category: 'Audio',
        title: 'Sony WH-1000XM5',
        description: '2 years remaining',
        size: 'normal',
    },
    {
        id: 3,
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop',
        alt: 'Camera',
        category: 'Camera',
        title: 'Sony Alpha a7 IV',
        description: 'Lifetime protection',
        size: 'normal',
    },
    {
        id: 4,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
        alt: 'MacBook',
        category: 'Laptop',
        title: 'MacBook Pro M3',
        description: 'AppleCare+ synced',
        size: 'normal',
    },
    {
        id: 5,
        image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400&h=300&fit=crop',
        alt: 'Gaming Console',
        category: 'Gaming',
        title: 'PlayStation 5',
        description: 'Extended warranty',
        size: 'normal',
    },
    {
        id: 6,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=600&fit=crop',
        alt: 'Coffee Machine',
        category: 'Appliances',
        title: 'Breville Oracle',
        description: '5 year protection',
        size: 'tall',
    },
];

function GalleryItem({ item }) {
    const itemRef = useRef(null);

    useEffect(() => {
        const element = itemRef.current;
        if (!element) return;

        const handleMouseMove = (e) => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        };

        const handleMouseLeave = () => {
            element.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            element.style.transition = 'transform 0.5s ease';
        };

        const handleMouseEnter = () => {
            element.style.transition = 'transform 0.1s ease';
        };

        element.addEventListener('mousemove', handleMouseMove);
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            element.removeEventListener('mousemove', handleMouseMove);
            element.removeEventListener('mouseleave', handleMouseLeave);
            element.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, []);

    return (
        <div
            ref={itemRef}
            className={`gallery-item ${item.size}`}
            data-category={item.category.toLowerCase()}
        >
            <div className="gallery-image">
                <img src={item.image} alt={item.alt} loading="lazy" />
                <div className="gallery-overlay">
                    <span className="gallery-category">{item.category}</span>
                    <h4>{item.title}</h4>
                    <p>{item.description}</p>
                </div>
            </div>
        </div>
    );
}

export default function Gallery() {
    return (
        <section className="gallery-section" id="gallery">
            <div className="container">
                <div className="gallery-header">
                    <span className="section-label">VAULT SHOWCASE</span>
                    <h2 className="section-title">
                        Products our users<br />
                        <span className="accent-italic">trust us with.</span>
                    </h2>
                </div>
                <div className="gallery-grid">
                    {galleryItems.map((item) => (
                        <GalleryItem key={item.id} item={item} />
                    ))}
                </div>
                <div className="gallery-stats">
                    <div className="gallery-stat">
                        <span className="stat-value">50K+</span>
                        <span className="stat-desc">Products Protected</span>
                    </div>
                    <div className="gallery-stat">
                        <span className="stat-value">$2.3M</span>
                        <span className="stat-desc">Claims Processed</span>
                    </div>
                    <div className="gallery-stat">
                        <span className="stat-value">98%</span>
                        <span className="stat-desc">Claim Success Rate</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
