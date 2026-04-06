import axios from 'axios';

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
    (error) => {
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
            localStorage.removeItem('token');
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
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
