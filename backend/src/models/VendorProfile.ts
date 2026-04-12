import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPrefs {
    newVerificationRequest: boolean;
    extensionRequest:       boolean;
    repairClaim:            boolean;
    claimScheduled:         boolean;
    emailDigest:            boolean;
}

export interface IBusinessDetails {
    companyName:   string;
    address:       string;
    city:          string;
    state:         string;
    pincode:       string;
    country:       string;
    website:       string;
    supportPhone:  string;
    supportEmail:  string;
    gstNumber:     string;
    description:   string;
}

export interface IVendorProfile extends Document {
    userId:        string;          // ref to User._id
    email:         string;          // vendor's login email (index)
    displayName:   string;
    brand:         string;
    logoUrl:       string;
    notifications: INotificationPrefs;
    business:      IBusinessDetails;
    updatedAt:     Date;
}

const notifSchema = new Schema<INotificationPrefs>(
    {
        newVerificationRequest: { type: Boolean, default: true  },
        extensionRequest:       { type: Boolean, default: true  },
        repairClaim:            { type: Boolean, default: true  },
        claimScheduled:         { type: Boolean, default: true  },
        emailDigest:            { type: Boolean, default: false },
    },
    { _id: false }
);

const businessSchema = new Schema<IBusinessDetails>(
    {
        companyName:  { type: String, default: '' },
        address:      { type: String, default: '' },
        city:         { type: String, default: '' },
        state:        { type: String, default: '' },
        pincode:      { type: String, default: '' },
        country:      { type: String, default: 'India' },
        website:      { type: String, default: '' },
        supportPhone: { type: String, default: '' },
        supportEmail: { type: String, default: '' },
        gstNumber:    { type: String, default: '' },
        description:  { type: String, default: '' },
    },
    { _id: false }
);

const vendorProfileSchema = new Schema<IVendorProfile>(
    {
        userId:      { type: String, required: true, unique: true },
        email:       { type: String, required: true, unique: true },
        displayName: { type: String, default: '' },
        brand:       { type: String, default: '' },
        logoUrl:     { type: String, default: '' },
        notifications: { type: notifSchema,   default: () => ({}) },
        business:      { type: businessSchema, default: () => ({}) },
    },
    { timestamps: true }
);

vendorProfileSchema.index({ email: 1 }, { unique: true });

export const VendorProfile = mongoose.model<IVendorProfile>('VendorProfile', vendorProfileSchema);
