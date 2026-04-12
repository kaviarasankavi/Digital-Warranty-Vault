import api from './axios';

export interface DisputeMessage {
    sender: 'user' | 'vendor' | 'admin';
    senderName: string;
    text: string;
    timestamp: string;
}

export interface Dispute {
    _id: string;
    referenceId: string;
    referenceType: 'claim' | 'verification';
    productName: string;
    brand: string;
    userId: string;
    userName: string;
    vendorEmail: string;
    status: 'open' | 'resolved_user' | 'resolved_vendor';
    messages: DisputeMessage[];
    resolutionReason: string;
    createdAt: string;
    updatedAt: string;
}

export const disputesApi = {
    // User / Vendor
    openDispute: async (referenceId: string, referenceType: 'claim' | 'verification', text: string): Promise<Dispute> => {
        const res = await api.post('/disputes', { referenceId, referenceType, text });
        return res.data.data;
    },
    addMessage: async (disputeId: string, text: string): Promise<Dispute> => {
        const res = await api.post(`/disputes/${disputeId}/message`, { text });
        return res.data.data;
    },
    getMyDisputes: async (): Promise<Dispute[]> => {
        const res = await api.get('/disputes/my-disputes');
        return res.data.data;
    },
    getVendorDisputes: async (): Promise<Dispute[]> => {
        const res = await api.get('/disputes/vendor-disputes');
        return res.data.data;
    },

    // Admin
    getAdminDisputes: async (params: { page: number, limit: number, status: string }): Promise<any> => {
        const query = new URLSearchParams({
            page: String(params.page),
            limit: String(params.limit),
            status: params.status
        });
        const res = await api.get(`/admin/disputes?${query}`);
        return res.data;
    },
    addAdminMessage: async (disputeId: string, text: string): Promise<Dispute> => {
        const res = await api.post(`/admin/disputes/${disputeId}/message`, { text });
        return res.data.data;
    },
    resolveDispute: async (disputeId: string, resolution: 'force_approve' | 'uphold_rejection', resolutionReason: string): Promise<Dispute> => {
        const res = await api.patch(`/admin/disputes/${disputeId}/resolve`, { resolution, resolutionReason });
        return res.data.data;
    }
};
