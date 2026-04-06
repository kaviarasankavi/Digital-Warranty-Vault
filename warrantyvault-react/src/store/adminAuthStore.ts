import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: 'superadmin';
}

interface AdminAuthState {
    adminUser: AdminUser | null;
    isAdminAuthenticated: boolean;
    adminLogin: (user: AdminUser) => void;
    adminLogout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
    persist(
        (set) => ({
            adminUser: null,
            isAdminAuthenticated: false,
            adminLogin: (user) => set({ adminUser: user, isAdminAuthenticated: true }),
            adminLogout: () => set({ adminUser: null, isAdminAuthenticated: false }),
        }),
        {
            name: 'admin-auth-storage',
            partialize: (state) => ({
                adminUser: state.adminUser,
                isAdminAuthenticated: state.isAdminAuthenticated,
            }),
        }
    )
);
