import { useEffect, useState } from 'react';
import {
    BadgeCheck, CalendarPlus, Wrench, Clock,
    CheckCircle, XCircle, AlertCircle, TrendingUp,
    ArrowRight, Inbox,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { verificationApi } from '../../api/verificationApi';
import { warrantyExtensionApi } from '../../api/warrantyExtensionApi';
import { warrantyClaimApi } from '../../api/warrantyClaimApi';
import './VendorHome.css';

const VENDOR_DISPLAY: Record<string, string> = {
    'vendor@samsung.vault':     'Samsung Electronics',
    'vendor@dell.vault':        'Dell Technologies',
    'vendor@jbl.vault':         'JBL (Harman International)',
    'vendor@firebolt.vault':    'FireBolt Technologies',
    'vendor@sony.vault':        'Sony Corporation',
    'vendor@lg.vault':          'LG Electronics',
    'vendor@apple.vault':       'Apple Inc.',
};

interface Counts {
    verifyPending:    number;
    verifyVerified:   number;
    verifyRejected:   number;
    extPending:       number;
    extApproved:      number;
    extRejected:      number;
    claimSubmitted:   number;
    claimScheduled:   number;
    claimCompleted:   number;
}

export default function VendorHome() {
    const { user } = useAuthStore();
    const [counts,  setCounts]  = useState<Counts | null>(null);
    const [loading, setLoading] = useState(true);

    const brandName = user?.email ? (VENDOR_DISPLAY[user.email] ?? user.name ?? 'Vendor') : 'Vendor';
    const firstName = user?.name?.split(' ')[0] ?? 'Vendor';

    useEffect(() => {
        const load = async () => {
            try {
                const [vAll, eAll, cAll] = await Promise.all([
                    verificationApi.getVendorRequests(),
                    warrantyExtensionApi.getVendorRequests(),
                    warrantyClaimApi.getVendorClaims(),
                ]);

                setCounts({
                    verifyPending:  vAll.filter((r: any) => r.status === 'pending').length,
                    verifyVerified: vAll.filter((r: any) => r.status === 'verified').length,
                    verifyRejected: vAll.filter((r: any) => r.status === 'rejected').length,
                    extPending:     eAll.filter((r: any) => r.status === 'pending').length,
                    extApproved:    eAll.filter((r: any) => r.status === 'approved').length,
                    extRejected:    eAll.filter((r: any) => r.status === 'rejected').length,
                    claimSubmitted: cAll.filter((r: any) => r.status === 'submitted').length,
                    claimScheduled: cAll.filter((r: any) => r.status === 'scheduled').length,
                    claimCompleted: cAll.filter((r: any) => r.status === 'completed').length,
                });
            } catch { /* silent */ }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const totalPending = (counts?.verifyPending ?? 0) + (counts?.extPending ?? 0) + (counts?.claimSubmitted ?? 0);

    return (
        <div className="vh-page">
            {/* Welcome banner */}
            <div className="vh-banner">
                <div className="vh-banner-left">
                    <div className="vh-brand-pill">{brandName}</div>
                    <h1 className="vh-welcome">Welcome back, <span className="vh-accent">{firstName}</span> 👋</h1>
                    <p className="vh-sub">
                        {totalPending > 0
                            ? `You have ${totalPending} pending request${totalPending !== 1 ? 's' : ''} waiting for your action.`
                            : 'All requests are up to date. Great job!'}
                    </p>
                </div>
                <div className="vh-banner-right">
                    <div className="vh-total-badge">
                        <div className="vh-total-num">{loading ? '—' : totalPending}</div>
                        <div className="vh-total-label">Pending Actions</div>
                    </div>
                </div>
            </div>

            {/* 3 module cards */}
            <div className="vh-modules">
                {/* Verify Requests */}
                <div className="vh-module">
                    <div className="vh-module-hd">
                        <div className="vh-mod-icon vh-icon-teal"><BadgeCheck size={18} /></div>
                        <div>
                            <div className="vh-mod-title">Verify Requests</div>
                            <div className="vh-mod-sub">Product authenticity verifications</div>
                        </div>
                    </div>
                    <div className="vh-stats">
                        <div className="vh-stat vh-stat-amber">
                            <Clock size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.verifyPending}</span>
                            <span className="vh-stat-l">Pending</span>
                        </div>
                        <div className="vh-stat vh-stat-green">
                            <CheckCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.verifyVerified}</span>
                            <span className="vh-stat-l">Verified</span>
                        </div>
                        <div className="vh-stat vh-stat-red">
                            <XCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.verifyRejected}</span>
                            <span className="vh-stat-l">Rejected</span>
                        </div>
                    </div>
                    <NavLink to="/vendor/verify" className="vh-goto">
                        Go to Verify Requests <ArrowRight size={13}/>
                    </NavLink>
                </div>

                {/* Extensions */}
                <div className="vh-module">
                    <div className="vh-module-hd">
                        <div className="vh-mod-icon vh-icon-purple"><CalendarPlus size={18} /></div>
                        <div>
                            <div className="vh-mod-title">Warranty Extensions</div>
                            <div className="vh-mod-sub">User-requested warranty extensions</div>
                        </div>
                    </div>
                    <div className="vh-stats">
                        <div className="vh-stat vh-stat-amber">
                            <Clock size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.extPending}</span>
                            <span className="vh-stat-l">Pending</span>
                        </div>
                        <div className="vh-stat vh-stat-green">
                            <CheckCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.extApproved}</span>
                            <span className="vh-stat-l">Approved</span>
                        </div>
                        <div className="vh-stat vh-stat-red">
                            <XCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.extRejected}</span>
                            <span className="vh-stat-l">Rejected</span>
                        </div>
                    </div>
                    <NavLink to="/vendor/extensions" className="vh-goto">
                        Go to Extensions <ArrowRight size={13}/>
                    </NavLink>
                </div>

                {/* Repair Claims */}
                <div className="vh-module">
                    <div className="vh-module-hd">
                        <div className="vh-mod-icon vh-icon-orange"><Wrench size={18} /></div>
                        <div>
                            <div className="vh-mod-title">Repair Claims</div>
                            <div className="vh-mod-sub">Defect reports & service visits</div>
                        </div>
                    </div>
                    <div className="vh-stats">
                        <div className="vh-stat vh-stat-amber">
                            <AlertCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.claimSubmitted}</span>
                            <span className="vh-stat-l">New</span>
                        </div>
                        <div className="vh-stat vh-stat-blue">
                            <TrendingUp size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.claimScheduled}</span>
                            <span className="vh-stat-l">Scheduled</span>
                        </div>
                        <div className="vh-stat vh-stat-green">
                            <CheckCircle size={13}/>
                            <span className="vh-stat-n">{loading ? '—' : counts?.claimCompleted}</span>
                            <span className="vh-stat-l">Completed</span>
                        </div>
                    </div>
                    <NavLink to="/vendor/claims" className="vh-goto">
                        Go to Repair Claims <ArrowRight size={13}/>
                    </NavLink>
                </div>
            </div>

            {/* All-clear state */}
            {!loading && totalPending === 0 && (
                <div className="vh-allclear">
                    <Inbox size={32} />
                    <div className="vh-allclear-title">Inbox is clear!</div>
                    <p>No pending requests at the moment. Check back later.</p>
                </div>
            )}
        </div>
    );
}
