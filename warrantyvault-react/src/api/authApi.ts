import api from './axios';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: {
            id: string;
            name: string;
            email: string;
            role: 'admin' | 'vendor' | 'user';
            avatar?: string;
            createdAt: string;
        };
        token: string;
    };
}

export interface ProfileResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            name: string;
            email: string;
            role: 'admin' | 'vendor' | 'user';
            avatar?: string;
            createdAt: string;
        };
    };
}

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    getProfile: async (): Promise<ProfileResponse> => {
        const response = await api.get<ProfileResponse>('/auth/profile');
        return response.data;
    },
};
