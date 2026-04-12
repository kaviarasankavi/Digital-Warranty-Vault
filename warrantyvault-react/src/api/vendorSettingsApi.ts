import axios from './axios';

export interface NotificationPrefs {
    newVerificationRequest: boolean;
    extensionRequest:       boolean;
    repairClaim:            boolean;
    claimScheduled:         boolean;
    emailDigest:            boolean;
}

export interface BusinessDetails {
    companyName:  string;
    address:      string;
    city:         string;
    state:        string;
    pincode:      string;
    country:      string;
    website:      string;
    supportPhone: string;
    supportEmail: string;
    gstNumber:    string;
    description:  string;
}

export interface VendorSettingsData {
    name:          string;
    email:         string;
    displayName:   string;
    brand:         string;
    logoUrl:       string;
    notifications: NotificationPrefs;
    business:      BusinessDetails;
}

export const vendorSettingsApi = {
    get: async (): Promise<VendorSettingsData> => {
        const res = await axios.get('/vendor/settings');
        return res.data.data;
    },
    updateProfile: async (data: { name?: string; displayName?: string; logoUrl?: string }) => {
        const res = await axios.put('/vendor/settings/profile', data);
        return res.data;
    },
    changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
        const res = await axios.put('/vendor/settings/password', data);
        return res.data;
    },
    updateBusiness: async (data: Partial<BusinessDetails>) => {
        const res = await axios.put('/vendor/settings/business', data);
        return res.data;
    },
    updateNotifications: async (data: Partial<NotificationPrefs>) => {
        const res = await axios.put('/vendor/settings/notifications', data);
        return res.data;
    },
};
