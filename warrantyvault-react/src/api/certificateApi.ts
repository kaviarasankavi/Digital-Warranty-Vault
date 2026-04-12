import axiosInstance from './axios';

export interface Certificate {
    _id:                   string;
    certificateId:         string;
    verificationRequestId: string;
    productId:             number;
    productName:           string;
    brand:                 string;
    model:                 string;
    serialNumber:          string;
    userId:                string;
    userName:              string;
    userEmail:             string;
    vendorEmail:           string;
    vendorNote:            string;
    verifiedAt:            string;
    isValid:               boolean;
    issuedAt:              string;
}

export const certificateApi = {
    getMyCertificates: async (): Promise<Certificate[]> => {
        const res = await axiosInstance.get('/certificates');
        return res.data.data;
    },

    downloadUrl: (id: string): string => {
        const base = axiosInstance.defaults.baseURL ?? 'http://localhost:5001/api';
        return `${base}/certificates/${id}/download`;
    },

    /** Triggers browser download — attaches auth token as query param */
    download: async (id: string, fileName: string): Promise<void> => {
        const token = localStorage.getItem('token') ??
                      sessionStorage.getItem('token') ?? '';
        const res = await axiosInstance.get(`/certificates/${id}/download`, {
            responseType: 'blob',
        });
        const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    },
};
