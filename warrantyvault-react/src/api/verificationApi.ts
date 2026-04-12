import axios from './axios';

export interface VerificationRequest {
    _id: string;
    productId: number;
    productName: string;
    brand: string;
    serialNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    vendorEmail: string;
    status: 'pending' | 'verified' | 'rejected';
    requestedAt: string;
    verifiedAt: string | null;
    vendorNote: string;
    isEscalated: boolean;
}

export const verificationApi = {
    /** User: submit a verification request */
    requestVerification: async (payload: {
        productId: number;
        productName: string;
        brand: string;
        serialNumber?: string;
    }): Promise<{ success: boolean; message: string; data: VerificationRequest }> => {
        const res = await axios.post('/verify/request', payload);
        return res.data;
    },

    /** User: get all own verification requests */
    getMyRequests: async (): Promise<VerificationRequest[]> => {
        const res = await axios.get('/verify/my-requests');
        return res.data.data;
    },

    /** Vendor: get requests routed to this vendor's brand */
    getVendorRequests: async (status?: string): Promise<VerificationRequest[]> => {
        const params = status ? { status } : {};
        const res = await axios.get('/verify/vendor-requests', { params });
        return res.data.data;
    },

    /** Vendor: get pending count for sidebar badge */
    getVendorPendingCount: async (): Promise<number> => {
        const res = await axios.get('/verify/vendor-requests/count');
        return res.data.count;
    },

    /** Vendor: approve a verification request */
    verifyRequest: async (id: string, note?: string): Promise<VerificationRequest> => {
        const res = await axios.patch(`/verify/requests/${id}/verify`, { note });
        return res.data.data;
    },

    /** Vendor: reject a verification request */
    rejectRequest: async (id: string, note?: string): Promise<VerificationRequest> => {
        const res = await axios.patch(`/verify/requests/${id}/reject`, { note });
        return res.data.data;
    },
};
