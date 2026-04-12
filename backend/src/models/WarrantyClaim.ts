import mongoose, { Document, Schema } from 'mongoose';

export type ClaimStatus = 'submitted' | 'reviewed' | 'scheduled' | 'completed' | 'rejected';

export interface IClaimLocation {
    address:   string;
    city:      string;
    state:     string;
    pincode:   string;
    landmark?: string;
}

export interface IWarrantyClaim extends Document {
    claimNumber:         string;
    productId:           number;
    productName:         string;
    brand:               string;
    serialNumber:        string;
    userId:              string;
    userName:            string;
    userEmail:           string;
    userPhone:           string;
    vendorEmail:         string;
    defectDescription:   string;
    defectType:          string;      // e.g. Hardware, Software, Physical Damage
    location:            IClaimLocation;
    status:              ClaimStatus;
    scheduledDate:       string | null;  // e.g. "2024-05-10"
    scheduledTime:       string | null;  // e.g. "10:00 AM"
    vendorMessage:       string;
    rejectionReason:     string;
    isEscalated:         boolean;
    submittedAt:         Date;
    scheduledAt:         Date | null;
    completedAt:         Date | null;
}

const locationSchema = new Schema<IClaimLocation>(
    {
        address:  { type: String, required: true },
        city:     { type: String, required: true },
        state:    { type: String, required: true },
        pincode:  { type: String, required: true },
        landmark: { type: String, default: '' },
    },
    { _id: false }
);

const claimSchema = new Schema<IWarrantyClaim>(
    {
        claimNumber:       { type: String, required: true, unique: true, default: generateClaimNumber },
        productId:         { type: Number, required: true },
        productName:       { type: String, required: true },
        brand:             { type: String, required: true },
        serialNumber:      { type: String, default: '' },
        userId:            { type: String, required: true },
        userName:          { type: String, required: true },
        userEmail:         { type: String, required: true },
        userPhone:         { type: String, default: '' },
        vendorEmail:       { type: String, required: true },
        defectDescription: { type: String, required: true },
        defectType:        { type: String, default: '' },
        location:          { type: locationSchema, required: true },
        status:            { type: String, enum: ['submitted','reviewed','scheduled','completed','rejected'], default: 'submitted' },
        scheduledDate:     { type: String, default: null },
        scheduledTime:     { type: String, default: null },
        vendorMessage:     { type: String, default: '' },
        rejectionReason:   { type: String, default: '' },
        isEscalated:       { type: Boolean, default: false },
        submittedAt:       { type: Date, default: () => new Date() },
        scheduledAt:       { type: Date, default: null },
        completedAt:       { type: Date, default: null },
    },
    { timestamps: true }
);

claimSchema.index({ userId: 1 });
claimSchema.index({ vendorEmail: 1, status: 1 });

function generateClaimNumber(): string {
    const ts  = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CLM-${ts}-${rnd}`;
}

export const WarrantyClaim = mongoose.model<IWarrantyClaim>('WarrantyClaim', claimSchema);
