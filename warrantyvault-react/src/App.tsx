import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { useAuthStore } from './store/authStore';
import { useAdminAuthStore } from './store/adminAuthStore';
import './styles.css';

// ── User pages (lazy) ─────────────────────────────────────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Products = lazy(() => import('./pages/Products/Products'));
const Warranties = lazy(() => import('./pages/Warranties/Warranties'));
const Owners = lazy(() => import('./pages/Owners/Owners'));
const Verify = lazy(() => import('./pages/Authenticity/Verify'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const LandingPage = lazy(() => import('./pages/Landing'));

// ── Admin pages (lazy) ────────────────────────────────────────────────────────
const AdminLogin = lazy(() => import('./pages/Admin/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/Admin/AdminProducts'));
const AdminWarranties = lazy(() => import('./pages/Admin/AdminWarranties'));
const AdminOwners = lazy(() => import('./pages/Admin/AdminOwners'));
const AdminAuthenticity = lazy(() => import('./pages/Admin/AdminAuthenticity'));
const AdminSettings = lazy(() => import('./pages/Admin/AdminSettings'));
const AdminAnnouncements = lazy(() => import('./pages/Admin/AdminAnnouncements'));
const AdminAuditLogs = lazy(() => import('./pages/Admin/AdminAuditLogs'));

const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } },
});

function PageLoader() {
    return (
        <div className="page-loader">
            <div className="loader-spinner" />
            <span>Loading...</span>
        </div>
    );
}

// ── User route guards ─────────────────────────────────────────────────────────
function ProtectedRoute() {
    const { isAuthenticated } = useAuthStore();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return <>{children}</>;
}

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

// ── Admin route guards ────────────────────────────────────────────────────────
function AdminProtectedRoute() {
    const { isAdminAuthenticated } = useAdminAuthStore();
    if (!isAdminAuthenticated) return <Navigate to="/admin/login" replace />;
    return <Outlet />;
}

function AdminPublicRoute({ children }: { children: React.ReactNode }) {
    const { isAdminAuthenticated } = useAdminAuthStore();
    if (isAdminAuthenticated) return <Navigate to="/admin/dashboard" replace />;
    return <>{children}</>;
}

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                    <Routes>
                        {/* ── Public user routes ── */}
                        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
                        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                        {/* ── Protected user routes ── */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<DashboardLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/products" element={<Products />} />
                                <Route path="/warranties" element={<Warranties />} />
                                <Route path="/verify" element={<Verify />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/owners" element={<Owners />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </Route>

                        {/* ── Admin public route ── */}
                        <Route
                            path="/admin/login"
                            element={<AdminPublicRoute><AdminLogin /></AdminPublicRoute>}
                        />

                        {/* ── Admin protected routes ── */}
                        <Route path="/admin" element={<AdminProtectedRoute />}>
                            <Route element={<AdminLayout />}>
                                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="dashboard" element={<AdminDashboard />} />
                                <Route path="products" element={<AdminProducts />} />
                                <Route path="warranties" element={<AdminWarranties />} />
                                <Route path="owners" element={<AdminOwners />} />
                                <Route path="verify" element={<AdminAuthenticity />} />
                                <Route path="audit-logs" element={<AdminAuditLogs />} />
                                <Route path="announcements" element={<AdminAnnouncements />} />
                                <Route path="settings" element={<AdminSettings />} />
                            </Route>
                        </Route>

                        {/* ── Fallback ── */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;
