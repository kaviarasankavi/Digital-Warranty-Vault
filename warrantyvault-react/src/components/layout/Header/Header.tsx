import { Bell, Search } from 'lucide-react';
import './Header.css';

interface HeaderProps {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function Header({ title }: HeaderProps) {
    return (
        <header className="dashboard-header dark-header">
            <div className="header-left">
                <h1 className="header-title">{title}</h1>
            </div>

            <div className="header-right">
                <div className="header-search">
                    <Search size={16} />
                    <input type="text" placeholder="Search serial numbers, products..." />
                </div>

                <button className="header-notifications">
                    <Bell size={20} />
                    <span className="notification-dot" />
                </button>
            </div>
        </header>
    );
}
