import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { useAuthStore } from './store/authStore';
import './styles.css';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products/Products'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const LandingPage = lazy(() => import('./pages/Landing'));

// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});

// Loading fallback
function PageLoader() {
    return (
        <div className="page-loader">
            <div className="loader-spinner" />
            <span>Loading...</span>
        </div>
    );
}

// Protected route wrapper
function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

// Dashboard layout wrapper
function DashboardLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Suspense fallback={<PageLoader />}>
                    <Outlet />
                </Suspense>
            </main>
        </div>
    );
}

// Public route (redirect to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* Public routes */}
                        <Route
                            path="/"
                            element={
                                <PublicRoute>
                                    <LandingPage />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/register"
                            element={
                                <PublicRoute>
                                    <Register />
                                </PublicRoute>
                            }
                        />

                        {/* Protected routes with dashboard layout */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/warranties" element={<Dashboard />} />
                                <Route path="/verify" element={<Dashboard />} />
                                <Route path="/owners" element={<Dashboard />} />
                                <Route path="/settings" element={<Dashboard />} />
                            </Route>
                        </Route>

                        {/* 404 redirect */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
