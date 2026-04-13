import api from './axios';

export interface AuditTrailEntry {
    user: {
        userId: string;
        name:   string;
        email:  string;
    } | null;
    product: {
        productId:    number;
        name:         string;
        brand:        string;
        serialNumber: string;
    } | null;
    vendor: {
        email: string;
        brand: string;
    } | null;
    verificationRequest: {
        requestId:    string;
        status:       'pending' | 'verified' | 'rejected';
        requestedAt:  string | null;
        verifiedAt:   string | null;
        rejectedAt:   string | null;
        vendorNote:   string | null;
        productName:  string;
        brand:        string;
        serialNumber: string;
    } | null;
    certificate: {
        certificateId: string;
        issuedAt:      string | null;
        isValid:       boolean;
    } | null;
}

export interface AuditTrailResponse {
    success:      boolean;
    serialNumber?: string;
    count:        number;
    data:         AuditTrailEntry[];
}

export const graphApi = {
    /** Get the full audit trail for a specific serial number */
    getAuditTrailBySerial: async (serialNumber: string): Promise<AuditTrailResponse> => {
        const res = await api.get<AuditTrailResponse>(
            `/graph/audit-trail/${encodeURIComponent(serialNumber)}`
        );
        return res.data;
    },

    /** Get all audit trails for the currently logged-in user */
    getMyTrails: async (): Promise<AuditTrailResponse> => {
        const res = await api.get<AuditTrailResponse>('/graph/my-trails');
        return res.data;
    },
};
