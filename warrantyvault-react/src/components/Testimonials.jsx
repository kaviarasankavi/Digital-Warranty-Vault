export default function Testimonials() {
    return (
        <section className="testimonials" id="testimonials">
            <div className="container">
                <div className="testimonials-grid">
                    <div className="testimonial-main">
                        <div className="quote-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 8H6C5.46957 8 4.96086 8.21071 4.58579 8.58579C4.21071 8.96086 4 9.46957 4 10V14C4 14.5304 4.21071 15.0391 4.58579 15.4142C4.96086 15.7893 5.46957 16 6 16H8L10 20V8Z" fill="currentColor" />
                                <path d="M20 8H16C15.4696 8 14.9609 8.21071 14.5858 8.58579C14.2107 8.96086 14 9.46957 14 10V14C14 14.5304 14.2107 15.0391 14.5858 15.4142C14.9609 15.7893 15.4696 16 16 16H18L20 20V8Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="section-label">MEMBER STORIES</span>
                        <blockquote className="testimonial-quote">
                            WarrantyVault handled my claim with an elegance I didn't expect from an insurance provider. It felt personal.
                        </blockquote>
                        <div className="testimonial-author">
                            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" alt="Sarah J." />
                            <div className="author-info">
                                <strong>Sarah J.</strong>
                                <span>New York, NY</span>
                            </div>
                        </div>
                        <a href="#" className="testimonial-link">
                            View all reviews
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </a>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">★★★★★</div>
                        <p>"Finally, a dashboard that makes sense. I tracked my repair in real-time."</p>
                        <div className="card-author">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop" alt="Michael Chen" />
                            <div>
                                <strong>Michael Chen</strong>
                                <span>VERIFIED MEMBER</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
