import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MessageSquareWarning } from 'lucide-react';
import { disputesApi, Dispute } from '../../api/disputesApi';
import './VendorDisputes.css';

export default function VendorDisputes() {
    const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
    const [msgText, setMsgText] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { data: disputes = [], isLoading, refetch } = useQuery({
        queryKey: ['vendor-disputes'],
        queryFn: () => disputesApi.getVendorDisputes()
    });

    const handleSendMessage = async () => {
        if (!selectedDispute || !msgText.trim()) return;
        setActionLoading(true);
        try {
            await disputesApi.addMessage(selectedDispute._id, msgText);
            setMsgText('');
            
            // Refetch to get new message
            const res = await disputesApi.getVendorDisputes();
            const updated = res.find(d => d._id === selectedDispute._id);
            if(updated) setSelectedDispute(updated);
            
            await refetch();
        } catch (err) {
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    if (isLoading) {
        return <div className="vdisp-empty"><Loader2 size={32} style={{animation:'spin 1s linear infinite'}}/></div>;
    }

    return (
        <div className="vdisp-page">
            <div className="vdisp-header">
                <div>
                    <h1>Disputes & Escalations</h1>
                    <p>Review and defend claims escalated to the Admin by consumers.</p>
                </div>
            </div>

            {disputes.length === 0 ? (
                <div className="vdisp-empty">
                    <MessageSquareWarning size={48} opacity={0.3} style={{marginBottom: '1rem', display: 'block', margin: '0 auto'}}/>
                    No active or past disputes found.
                </div>
            ) : (
                <div className="vdisp-grid">
                    {disputes.map(d => (
                        <div key={d._id} className="vdisp-card" onClick={() => setSelectedDispute(d)}>
                            <div className="vdisp-card-head">
                                <span className="vdisp-card-title">{d.productName}</span>
                                <span className="vdisp-card-type">{d.referenceType}</span>
                            </div>
                            <div className="vdisp-card-meta">
                                <div className="vdisp-card-row">
                                    <span className="label">Brand:</span>
                                    <span className="val">{d.brand}</span>
                                </div>
                                <div className="vdisp-card-row">
                                    <span className="label">Consumer:</span>
                                    <span className="val">{d.userName}</span>
                                </div>
                                <div className="vdisp-card-row">
                                    <span className="label">Opened:</span>
                                    <span className="val">{new Date(d.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className={`vdisp-status ${d.status === 'open' ? 'open' : 'resolved'}`}>
                                {d.status === 'open' ? 'Action Required' : 'Resolved'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chat Modal */}
            {selectedDispute && (
                <div className="vdisp-modal-overlay" onClick={() => setSelectedDispute(null)}>
                    <div className="vdisp-modal" onClick={e => e.stopPropagation()}>
                        <div className="vdisp-modal-head">
                            <h2>Escalation Thread</h2>
                            <button className="vdisp-close-btn" onClick={() => setSelectedDispute(null)}>&times;</button>
                        </div>
                        <div className="vdisp-modal-body">
                            {selectedDispute.messages.map((m, i) => (
                                <div key={i} className={`vdisp-msg ${m.sender}`}>
                                    <div className="vdisp-msg-info">
                                        <span>{m.senderName} ({m.sender.toUpperCase()})</span>
                                        <span>•</span>
                                        <span>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    <div className="vdisp-bubble">
                                        {m.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {selectedDispute.status === 'open' ? (
                            <div className="vdisp-modal-foot">
                                <input 
                                    className="vdisp-input" 
                                    placeholder="Type your defense or message..." 
                                    value={msgText}
                                    onChange={e => setMsgText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                />
                                <button className="vdisp-btn-send" onClick={handleSendMessage} disabled={actionLoading || !msgText.trim()}>
                                    {actionLoading ? <Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> : 'Send'}
                                </button>
                            </div>
                        ) : (
                            <div style={{padding: '1rem', textAlign: 'center', background: '#f8fafc', color: '#64748b', borderTop: '1px solid #e2e8f0'}}>
                                This dispute has been resolved by an Admin.
                                {selectedDispute.resolutionReason && (
                                    <div style={{marginTop: '0.5rem', fontStyle: 'italic', fontSize: '0.85rem'}}>
                                        "{selectedDispute.resolutionReason}"
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
