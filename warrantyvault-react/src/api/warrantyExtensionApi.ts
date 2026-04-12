import axios from './axios';

export interface ExtensionRequest {
    _id: string;
    productId: number;
    productName: string;
    brand: string;
    serialNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    vendorEmail: string;
    currentExpiry: string | null;
    requestedExpiry: string | null;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    newExpiry: string | null;
    vendorNote: string;
    requestedAt: string;
    resolvedAt: string | null;
}

export const warrantyExtensionApi = {
    requestExtension: async (payload: {
        productId: number;
        productName: string;
        brand: string;
        serialNumber?: string;
        currentExpiry?: string | null;
        requestedExpiry?: string | null;
        reason?: string;
    }): Promise<{ success: boolean; message: string; data: ExtensionRequest }> => {
        const res = await axios.post('/warranty-extension/request', payload);
        return res.data;
    },

    getMyRequests: async (): Promise<ExtensionRequest[]> => {
        const res = await axios.get('/warranty-extension/my-requests');
        return res.data.data;
    },

    getVendorRequests: async (status?: string): Promise<ExtensionRequest[]> => {
        const params = status ? { status } : {};
        const res = await axios.get('/warranty-extension/vendor-requests', { params });
        return res.data.data;
    },

    getVendorPendingCount: async (): Promise<number> => {
        const res = await axios.get('/warranty-extension/vendor-requests/count');
        return res.data.count;
    },

    approveRequest: async (id: string, newExpiry: string, note?: string): Promise<ExtensionRequest> => {
        const res = await axios.patch(`/warranty-extension/requests/${id}/approve`, { newExpiry, note });
        return res.data.data;
    },

    denyRequest: async (id: string, note?: string): Promise<ExtensionRequest> => {
        const res = await axios.patch(`/warranty-extension/requests/${id}/deny`, { note });
        return res.data.data;
    },
};
