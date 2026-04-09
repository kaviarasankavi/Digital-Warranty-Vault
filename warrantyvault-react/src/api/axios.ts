import axios from 'axios';

// Import auth store dynamically to avoid circular dependency issues
let authStore: any = null;
const getAuthStore = async () => {
    if (!authStore) {
        const module = await import('../store/authStore');
        authStore = module.useAuthStore.getState();
    }
    return authStore;
};

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — structured error normalisation
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // ── Network / timeout errors (no response from server) ──
        if (!error.response) {
            error.friendlyMessage = error.code === 'ECONNABORTED'
                ? 'Request timed out. Please try again.'
                : 'Network error. Please check your connection.';
            return Promise.reject(error);
        }

        const { status, data } = error.response;

        // ── Attach a normalised user-facing message ──
        error.friendlyMessage =
            data?.message ||
            getDefaultMessage(status);

        // ── Attach the structured error code if the backend sent one ──
        error.errorCode = data?.errorCode || null;

        // ── 401 Unauthorized — clear session & redirect ──
        if (status === 401) {
            // Clear both localStorage and auth store
            localStorage.removeItem('token');
            
            // Get auth store and logout properly
            try {
                const store = await getAuthStore();
                store.logout();
            } catch (e) {
                console.error('Failed to clear auth store:', e);
            }
            
            // Only redirect if not already on login or public pages
            const currentPath = window.location.pathname;
            const publicPaths = ['/login', '/register', '/'];
            if (!publicPaths.some(path => currentPath.includes(path))) {
                // Use a slight delay to ensure store updates
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Returns a sensible default message for common HTTP status codes.
 */
function getDefaultMessage(status: number): string {
    const defaults: Record<number, string> = {
        400: 'Invalid request. Please check your input.',
        401: 'Session expired. Please log in again.',
        403: 'You do not have permission to perform this action.',
        404: 'The requested resource was not found.',
        409: 'This resource already exists.',
        422: 'Validation failed. Please check your input.',
        429: 'Too many requests. Please wait and try again.',
        500: 'Something went wrong on our end. Please try again later.',
        503: 'Service temporarily unavailable. Please try again later.',
    };
    return defaults[status] || 'An unexpected error occurred.';
}

export default api;
