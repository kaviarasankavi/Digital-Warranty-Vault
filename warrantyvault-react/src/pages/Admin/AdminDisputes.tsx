import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { disputesApi, Dispute } from '../../api/disputesApi';
import './AdminDisputes.css';

export default function AdminDisputes() {
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [msgText, setMsgText] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['admin-disputes', page, status],
        queryFn: () => disputesApi.getAdminDisputes({ page, limit: 100, status })
    });

    const disputes: Dispute[] = data?.data || [];
    const selected = disputes.find(d => d._id === selectedId);

    const handleSendMessage = async () => {
        if (!selectedId || !msgText.trim()) return;
        setActionLoading(true);
        try {
            await disputesApi.addAdminMessage(selectedId, msgText);
            setMsgText('');
            await refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleResolve = async (resolution: 'force_approve' | 'uphold_rejection') => {
        if (!selectedId) return;
        const confirmMsg = resolution === 'force_approve' 
            ? "Are you sure you want to FORCE APPROVE this request overriding the vendor?" 
            : "Are you sure you want to UPHOLD THE REJECTION and close this case?";
        if (!window.confirm(confirmMsg)) return;

        setActionLoading(true);
        try {
            await disputesApi.resolveDispute(selectedId, resolution, "Admin reviewed and resolved the dispute.");
            await refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="adisp-page">
            <div className="adisp-header">
                <h1 className="adisp-title">Resolution <span style={{color: '#818cf8'}}>Center</span></h1>
                <p className="adisp-sub">Arbitrate escalated claims and verification requests</p>
            </div>

            <div className="adisp-layout">
                {/* LEFT PANE - List */}
                <div className="adisp-list">
                    <select className="adisp-filter" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="all">All Disputes</option>
                        <option value="open">Open (Requires Action)</option>
                        <option value="resolved_user">Resolved (Force Approved)</option>
                        <option value="resolved_vendor">Resolved (Upheld Rejection)</option>
                    </select>

                    {isLoading ? (
                        <div className="adisp-empty"><Loader2 size={24} className="aauth-spinner"/></div>
                    ) : disputes.length === 0 ? (
                        <div className="adisp-empty">No disputes found.</div>
                    ) : (
                        disputes.map(d => (
                            <div 
                                key={d._id} 
                                className={`adisp-item ${selectedId === d._id ? 'active' : ''}`}
                                onClick={() => setSelectedId(d._id)}
                            >
                                <div className="adisp-item-head">
                                    <span className="adisp-item-title">{d.productName}</span>
                                    <span className="adisp-item-type">{d.referenceType}</span>
                                </div>
                                <div className="adisp-item-sub">
                                    <span>Vendor: {d.vendorEmail}</span>
                                    <span>User: {d.userName}</span>
                                </div>
                                <span className={`adisp-badge ${d.status === 'open' ? 'open' : 'resolved'}`}>
                                    {d.status.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT PANE - Detail & Chat */}
                <div className="adisp-detail">
                    {!selected ? (
                        <div className="adisp-empty">
                            <ShieldAlert size={48} opacity={0.2} style={{marginBottom: 10}}/>
                            Select a dispute to review
                        </div>
                    ) : (
                        <>
                            <div className="adisp-info-bar">
                                <div className="adisp-info-text">
                                    <strong>{selected.brand} - {selected.productName}</strong>
                                    <span>Ref: {selected.referenceId.slice(-8).toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="adisp-chat">
                                {selected.messages.map((m, i) => (
                                    <div key={i} className={`adisp-msg ${m.sender}`}>
                                        <div className="adisp-msg-header">
                                            {m.senderName} ({m.sender.toUpperCase()})
                                            <span className="adisp-msg-time">
                                                {new Date(m.timestamp).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="adisp-msg-bubble">{m.text}</div>
                                    </div>
                                ))}
                                {selected.messages.length === 0 && <div className="adisp-empty">No messages yet.</div>}
                            </div>

                            <div className="adisp-controls">
                                {selected.status === 'open' ? (
                                    <>
                                        <div className="adisp-input-row">
                                            <input 
                                                type="text" 
                                                className="adisp-input" 
                                                placeholder="Type a message to both parties..." 
                                                value={msgText}
                                                onChange={e => setMsgText(e.target.value)}
                                                disabled={actionLoading}
                                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            />
                                            <button className="adisp-btn-send" onClick={handleSendMessage} disabled={actionLoading || !msgText.trim()}>
                                                {actionLoading ? <Loader2 size={16} className="aauth-spinner"/> : 'Send'}
                                            </button>
                                        </div>
                                        <div className="adisp-resolve-actions">
                                            <button className="adisp-btn-approve" onClick={() => handleResolve('force_approve')} disabled={actionLoading}>
                                                <CheckCircle size={16} style={{marginRight: 6, verticalAlign: 'middle'}}/>
                                                Force Approve User
                                            </button>
                                            <button className="adisp-btn-reject" onClick={() => handleResolve('uphold_rejection')} disabled={actionLoading}>
                                                <XCircle size={16} style={{marginRight: 6, verticalAlign: 'middle'}}/>
                                                Uphold Vendor Rejection
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="adisp-empty" style={{padding: '1rem', background: 'rgba(52,211,153,0.05)', color: '#34d399', borderRadius: '0.5rem', textAlign: 'center'}}>
                                        This dispute has been resolved ({selected.status.replace('_', ' ').toUpperCase()}).
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
