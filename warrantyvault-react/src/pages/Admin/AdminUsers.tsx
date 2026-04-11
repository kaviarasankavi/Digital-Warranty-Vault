import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCircle, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import './AdminUsers.css';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export default function AdminUsers() {
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('all');
    const [timeframe, setTimeframe] = useState('all');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-users', page, search, role, timeframe],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                search,
                role,
                timeframe
            });

            const res = await api.get(`/users?${params}`);
            return res.data;
        },
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRole(e.target.value);
        setPage(1);
    };

    const handleTimeframeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeframe(e.target.value);
        setPage(1);
    };

    const users: User[] = data?.data || [];
    const pagination = data?.pagination;

    return (
        <div className="admin-users-page">
            <div className="admin-users-header">
                <h2>
                    <UserCircle size={28} style={{ color: 'var(--primary-color)' }} />
                    Users' Info
                </h2>
            </div>

            <div className="admin-users-filters">
                <div className="users-search-box">
                    <Search size={18} color="var(--text-secondary)" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                
                <select className="users-filter-select" value={role} onChange={handleRoleChange}>
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="user">User</option>
                    <option value="vendor">Vendor</option>
                </select>

                <select className="users-filter-select" value={timeframe} onChange={handleTimeframeChange}>
                    <option value="all">All Time</option>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="this_year">This Year</option>
                </select>
            </div>

            {isError ? (
                <div className="error-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--coral)' }}>
                    <ShieldAlert size={48} style={{ marginBottom: '1rem', opacity: 0.8 }} />
                    <p>Failed to load users. Please ensure you have sufficient permissions.</p>
                </div>
            ) : isLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <div className="loader-spinner"></div>
                </div>
            ) : (
                <div className="admin-users-table-container">
                    <table className="admin-users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Signed Up At</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-500)' }}>
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id}>
                                        <td style={{ fontWeight: 500 }}>{user.name}</td>
                                        <td style={{ color: 'var(--gray-500)' }}>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--gray-500)' }}>
                                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {pagination && pagination.totalPages > 1 && (
                        <div className="users-pagination">
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total users)
                            </span>
                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn"
                                    disabled={pagination.page <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                <button
                                    className="pagination-btn"
                                    disabled={pagination.page >= pagination.totalPages}
                                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
