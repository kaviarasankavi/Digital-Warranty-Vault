import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, Megaphone } from 'lucide-react';
import api from '../../api/axios';
import './AnnouncementBar.css';

interface Announcement {
    id: number;
    message: string;
    link_text: string | null;
    link_url: string | null;
    bg_color: string;
    text_color: string;
}

export default function AnnouncementBar() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [dismissed, setDismissed] = useState<Set<number>>(new Set());
    const [isVisible, setIsVisible] = useState(true);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const res = await api.get('/announcements/active');
                if (res.data?.success && res.data.data?.length > 0) {
                    setAnnouncements(res.data.data);
                }
            } catch {
                // Silently fail — no announcements is fine
            }
        };
        fetchAnnouncements();
    }, []);

    // Auto-rotate announcements every 5 seconds
    useEffect(() => {
        if (visibleAnnouncements.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % visibleAnnouncements.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [announcements, dismissed]);

    // Measure the bar and push the navbar down via CSS variable
    const updateHeight = useCallback(() => {
        if (barRef.current) {
            const height = barRef.current.offsetHeight;
            document.documentElement.style.setProperty('--announcement-bar-height', `${height}px`);
        }
    }, []);

    useEffect(() => {
        updateHeight();
        window.addEventListener('resize', updateHeight);
        return () => {
            window.removeEventListener('resize', updateHeight);
            document.documentElement.style.setProperty('--announcement-bar-height', '0px');
        };
    }, [updateHeight, announcements, dismissed, isVisible]);

    const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));
    const current = visibleAnnouncements[currentIndex % Math.max(visibleAnnouncements.length, 1)];

    if (!isVisible || !current || visibleAnnouncements.length === 0) {
        // Reset CSS variable when bar is hidden
        document.documentElement.style.setProperty('--announcement-bar-height', '0px');
        return null;
    }

    return (
        <div
            ref={barRef}
            className="announcement-bar"
            style={{
                background: current.bg_color || '#6366f1',
                color: current.text_color || '#ffffff',
            }}
        >
            <div className="announcement-bar-inner">
                <div className="announcement-content">
                    <Megaphone size={14} className="announcement-icon" />
                    <span className="announcement-message">{current.message}</span>
                    {current.link_text && current.link_url && (
                        <a
                            href={current.link_url}
                            className="announcement-link"
                            style={{ color: current.text_color || '#ffffff' }}
                            target="_blank"
                            rel="noreferrer"
                        >
                            {current.link_text}
                            <ChevronRight size={12} />
                        </a>
                    )}
                </div>

                <div className="announcement-actions">
                    {visibleAnnouncements.length > 1 && (
                        <div className="announcement-dots">
                            {visibleAnnouncements.map((_, i) => (
                                <button
                                    key={i}
                                    className={`announcement-dot ${i === currentIndex % visibleAnnouncements.length ? 'active' : ''}`}
                                    onClick={() => setCurrentIndex(i)}
                                    style={{ borderColor: current.text_color || '#fff' }}
                                />
                            ))}
                        </div>
                    )}
                    <button
                        className="announcement-close"
                        onClick={() => {
                            setDismissed((prev) => new Set(prev).add(current.id));
                            setCurrentIndex(0);
                        }}
                        style={{ color: current.text_color || '#ffffff' }}
                        aria-label="Dismiss announcement"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
}
