import { Bell, Search, HelpCircle, Sun } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import '../../../styles/userDashboard.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    showGreeting?: boolean;
}

export function Header({ title, subtitle, showGreeting = true }: HeaderProps) {
    const { user } = useAuthStore();
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <header className="user-header">
            <div className="user-header-left">
                {showGreeting && user && (
                    <span className="user-header-greeting">
                        {getGreeting()}, {user.name.split(' ')[0]}
                    </span>
                )}
                <h1 className="user-header-title">
                    {title}
                    {subtitle && (
                        <span className="user-header-title-accent"> {subtitle}</span>
                    )}
                </h1>
            </div>

            <div className="user-header-right">
                <div className="user-header-search">
                    <Search size={16} />
                    <input 
                        type="text" 
                        placeholder="Search products, warranties..." 
                    />
                </div>

                <div className="user-header-actions">
                    <button className="user-header-btn" title="Help">
                        <HelpCircle size={18} />
                    </button>
                    <button className="user-header-btn" title="Theme">
                        <Sun size={18} />
                    </button>
                    <button className="user-header-btn" title="Notifications">
                        <Bell size={18} />
                        <span className="notification-dot" />
                    </button>
                </div>
            </div>
        </header>
    );
}
