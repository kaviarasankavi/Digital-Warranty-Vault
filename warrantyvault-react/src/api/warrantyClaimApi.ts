import axios from './axios';

export interface ClaimLocation {
    address:  string;
    city:     string;
    state:    string;
    pincode:  string;
    landmark?: string;
}

export type ClaimStatus = 'submitted' | 'reviewed' | 'scheduled' | 'completed' | 'rejected';

export interface WarrantyClaim {
    _id:               string;
    claimNumber:       string;
    productId:         number;
    productName:       string;
    brand:             string;
    serialNumber:      string;
    userId:            string;
    userName:          string;
    userEmail:         string;
    userPhone:         string;
    vendorEmail:       string;
    defectDescription: string;
    defectType:        string;
    location:          ClaimLocation;
    status:            ClaimStatus;
    scheduledDate:     string | null;
    scheduledTime:     string | null;
    vendorMessage:     string;
    rejectionReason:   string;
    submittedAt:       string;
    scheduledAt:       string | null;
    completedAt:       string | null;
}

export const warrantyClaimApi = {
    submit: async (payload: {
        productId: number; productName: string; brand: string;
        serialNumber?: string; defectDescription: string; defectType?: string;
        userPhone?: string; location: ClaimLocation;
    }) => {
        const res = await axios.post('/claims', payload);
        return res.data as { success: boolean; message: string; data: WarrantyClaim };
    },

    getMyClaims: async (): Promise<WarrantyClaim[]> => {
        const res = await axios.get('/claims/my-claims');
        return res.data.data;
    },

    getVendorClaims: async (status?: string): Promise<WarrantyClaim[]> => {
        const params = status ? { status } : {};
        const res = await axios.get('/claims/vendor-claims', { params });
        return res.data.data;
    },

    getVendorCount: async (): Promise<number> => {
        const res = await axios.get('/claims/vendor-claims/count');
        return res.data.count;
    },

    schedule: async (id: string, payload: {
        scheduledDate: string; scheduledTime: string; vendorMessage?: string;
    }): Promise<WarrantyClaim> => {
        const res = await axios.patch(`/claims/${id}/schedule`, payload);
        return res.data.data;
    },

    complete: async (id: string, vendorMessage?: string): Promise<WarrantyClaim> => {
        const res = await axios.patch(`/claims/${id}/complete`, { vendorMessage });
        return res.data.data;
    },

    reject: async (id: string, reason?: string, vendorMessage?: string): Promise<WarrantyClaim> => {
        const res = await axios.patch(`/claims/${id}/reject`, { reason, vendorMessage });
        return res.data.data;
    },
};
