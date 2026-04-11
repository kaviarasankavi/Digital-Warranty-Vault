import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, User, ArrowRight, X } from 'lucide-react';
import './NewsSection.css';

interface NewsArticle {
    _id: string;
    title: string;
    summary: string;
    content: string;
    author: string;
    publishedAt: string;
}

export default function NewsSection() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await api.get('/news/active?limit=3');
                if (res.data?.success) {
                    setNews(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch news:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, []);

    // Prevent scrolling behind the modal
    useEffect(() => {
        if (selectedArticle) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [selectedArticle]);

    if (loading || news.length === 0) return null;

    return (
        <section className="news-section" id="news">
            <div className="section-container">
                <div className="section-header">
                    <h2 className="section-title">Latest &amp; Greatest</h2>
                    <p className="section-subtitle">
                        Stay updated with the latest news, announcements, and product updates from WarrantyVault.
                    </p>
                </div>

                <div className="news-grid">
                    {news.map((item) => (
                        <div key={item._id} className="news-card-wrapper">
                            <article className="news-article-card">
                                <div className="news-card-content-wrapper">
                                    <div className="news-card-meta-list">
                                        <div className="news-card-meta-item">
                                            <Calendar size={14} />
                                            <span>
                                                {new Date(item.publishedAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="news-card-meta-item">
                                            <User size={14} />
                                            <span>{item.author}</span>
                                        </div>
                                    </div>
                                    <h3 className="news-card-heading">
                                        {item.title}
                                    </h3>
                                    <p className="news-card-excerpt">
                                        {item.summary}
                                    </p>
                                    <div className="news-card-footer">
                                        <button className="news-read-more" onClick={() => setSelectedArticle(item)}>
                                            Read Article <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            </article>
                        </div>
                    ))}
                </div>
            </div>

            {selectedArticle && (
                <div className="news-modal-overlay" onClick={() => setSelectedArticle(null)}>
                    <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="news-modal-close" onClick={() => setSelectedArticle(null)}>
                            <X size={20} />
                        </button>
                        <div className="news-modal-body">
                            <h2 className="news-modal-title">{selectedArticle.title}</h2>
                            <div className="news-modal-meta">
                                <span><Calendar size={14} /> {new Date(selectedArticle.publishedAt).toLocaleDateString(undefined, {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}</span>
                                <span><User size={14} /> By {selectedArticle.author}</span>
                            </div>
                            <div className="news-modal-text">
                                {selectedArticle.content.split('\n').map((para, idx) => (
                                    <p key={idx}>{para}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
