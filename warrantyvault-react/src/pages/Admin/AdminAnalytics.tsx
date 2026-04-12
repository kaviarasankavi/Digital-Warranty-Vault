import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
    Users, Package, BadgeCheck, CalendarPlus,
    Wrench, Award, TrendingUp, RefreshCw, BarChart3,
    ShieldCheck, Tag,
} from 'lucide-react';
import api from '../../api/axios';
import './AdminAnalytics.css';

type OverviewData = {
    totalUsers: number; totalVendors: number; totalProducts: number;
    totalVerifications: number; verifiedCount: number; rejectedCount: number;
    totalExtensions: number; approvedExtensions: number;
    totalClaims: number; scheduledClaims: number; completedClaims: number;
    totalCertificates: number;
};

const PIE_VERIFY_COLORS: Record<string, string> = {
    verified: '#22d3ee', pending: '#fbbf24', rejected: '#f87171',
};
const PIE_CLAIM_COLORS: Record<string, string> = {
    submitted: '#818cf8', scheduled: '#34d399', completed: '#6ee7b7',
    rejected: '#f87171',
};

const pct = (num: number, denom: number) =>
    denom === 0 ? '0%' : `${Math.round((num / denom) * 100)}%`;

export default function AdminAnalytics() {
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['admin-platform-analytics'],
        queryFn: async () => {
            const res = await api.get('/admin/analytics');
            return res.data.data;
        },
        staleTime: 60_000,
    });

    const ov: OverviewData | undefined = data?.overview;
    const ch = data?.charts;

    return (
        <div className="aa-page">
            {/* Header */}
            <div className="aa-header">
                <div>
                    <h1 className="aa-title">Platform <span className="aa-accent">Analytics</span></h1>
                    <p className="aa-sub">System-wide overview across all users, vendors, and activities</p>
                </div>
                <button className="aa-refresh" onClick={() => refetch()} disabled={isLoading}>
                    <RefreshCw size={14}/> Refresh
                </button>
            </div>

            {isError && (
                <div className="aa-error">Failed to load analytics data. Please try again.</div>
            )}

            {/* ── KPI cards ── */}
            <div className="aa-kpi-grid">
                {[
                    { icon: Users,       label: 'Registered Users',  val: ov?.totalUsers,         color: 'indigo', sub: `${ov?.totalVendors ?? 0} vendors`       },
                    { icon: Package,     label: 'Products Registered',val: ov?.totalProducts,      color: 'teal',   sub: 'across all users'                        },
                    { icon: BadgeCheck,  label: 'Verifications',      val: ov?.totalVerifications, color: 'blue',   sub: `${pct(ov?.verifiedCount??0, ov?.totalVerifications??0)} verified` },
                    { icon: CalendarPlus,label: 'Extension Requests', val: ov?.totalExtensions,    color: 'purple', sub: `${pct(ov?.approvedExtensions??0, ov?.totalExtensions??0)} approved` },
                    { icon: Wrench,      label: 'Repair Claims',      val: ov?.totalClaims,        color: 'orange', sub: `${ov?.completedClaims ?? 0} completed`   },
                    { icon: Award,       label: 'Certificates Issued',val: ov?.totalCertificates,  color: 'amber',  sub: 'valid certificates'                      },
                ].map(({ icon: Icon, label, val, color, sub }) => (
                    <div key={label} className={`aa-kpi aa-kpi-${color}`}>
                        <div className="aa-kpi-icon"><Icon size={20}/></div>
                        <div className="aa-kpi-val">{isLoading ? '—' : (val ?? 0)}</div>
                        <div className="aa-kpi-label">{label}</div>
                        <div className="aa-kpi-sub">{isLoading ? '…' : sub}</div>
                    </div>
                ))}
            </div>

            {/* ── Charts row 1 ── */}
            <div className="aa-charts-row">
                {/* Monthly user signups */}
                <div className="aa-chart-card aa-chart-wide">
                    <div className="aa-chart-hd">
                        <TrendingUp size={15}/>  User Signups — Last 6 Months
                    </div>
                    {isLoading ? <div className="aa-chart-loading"/> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={ch?.monthlySignups ?? []} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)"/>
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }}/>
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }}/>
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 13, border: '1px solid #e2e8f0' }}/>
                                <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }}/>
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Verification breakdown pie */}
                <div className="aa-chart-card">
                    <div className="aa-chart-hd"><BadgeCheck size={15}/> Verification Status</div>
                    {isLoading ? <div className="aa-chart-loading"/> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={ch?.verificationBreakdown ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {(ch?.verificationBreakdown ?? []).map((entry: any) => (
                                        <Cell key={entry.status} fill={PIE_VERIFY_COLORS[entry.status] ?? '#94a3b8'}/>
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 12 }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Charts row 2 ── */}
            <div className="aa-charts-row">
                {/* Brand distribution bar */}
                <div className="aa-chart-card aa-chart-wide">
                    <div className="aa-chart-hd"><Tag size={15}/> Products by Brand (Top 8)</div>
                    {isLoading ? <div className="aa-chart-loading"/> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={ch?.brandDistribution ?? []} margin={{ top:10, right:10, left:-20, bottom:0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)"/>
                                <XAxis dataKey="brand" tick={{ fontSize: 11, fill: '#94a3b8' }}/>
                                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }}/>
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 13 }}/>
                                <Bar dataKey="products" fill="#6366f1" radius={[6,6,0,0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Claims breakdown pie */}
                <div className="aa-chart-card">
                    <div className="aa-chart-hd"><Wrench size={15}/> Repair Claim Status</div>
                    {isLoading ? <div className="aa-chart-loading"/> : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={ch?.claimBreakdown ?? []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} paddingAngle={3} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                    {(ch?.claimBreakdown ?? []).map((entry: any) => (
                                        <Cell key={entry.status} fill={PIE_CLAIM_COLORS[entry.status] ?? '#94a3b8'}/>
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: 12 }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* ── Rate cards ── */}
            <div className="aa-rates">
                {[
                    { label: 'Verification Rate',  val: pct(ov?.verifiedCount??0, ov?.totalVerifications??0), icon: BadgeCheck, color: 'teal'  },
                    { label: 'Extension Approval', val: pct(ov?.approvedExtensions??0, ov?.totalExtensions??0), icon: CalendarPlus, color: 'purple' },
                    { label: 'Claim Completion',   val: pct(ov?.completedClaims??0, ov?.totalClaims??0), icon: Wrench, color: 'orange' },
                    { label: 'Certificate Coverage',val: pct(ov?.totalCertificates??0, ov?.verifiedCount??0), icon: Award, color: 'amber'  },
                ].map(({ label, val, icon: Icon, color }) => (
                    <div key={label} className={`aa-rate aa-rate-${color}`}>
                        <div className="aa-rate-hd"><Icon size={14}/>{label}</div>
                        <div className="aa-rate-val">{isLoading ? '—' : val}</div>
                        <div className="aa-rate-bar">
                            <div className="aa-rate-fill" style={{ width: isLoading ? '0' : val }}/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
