import mongoose, { Document, Schema } from 'mongoose';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface IVerificationRequest extends Document {
    productId: number;
    productName: string;
    brand: string;
    serialNumber: string;
    userId: string;
    userName: string;
    userEmail: string;
    vendorEmail: string;
    status: VerificationStatus;
    requestedAt: Date;
    verifiedAt: Date | null;
    vendorNote: string;
    isEscalated: boolean;
}

const verificationRequestSchema = new Schema<IVerificationRequest>(
    {
        productId:   { type: Number, required: true },
        productName: { type: String, required: true },
        brand:       { type: String, required: true },
        serialNumber:{ type: String, default: '' },
        userId:      { type: String, required: true },
        userName:    { type: String, required: true },
        userEmail:   { type: String, required: true },
        vendorEmail: { type: String, required: true },
        status:      { type: String, enum: ['pending','verified','rejected'], default: 'pending' },
        requestedAt: { type: Date, default: () => new Date() },
        verifiedAt:  { type: Date, default: null },
        vendorNote:  { type: String, default: '' },
        isEscalated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

verificationRequestSchema.index({ userId: 1 });
verificationRequestSchema.index({ vendorEmail: 1, status: 1 });

export const VerificationRequest = mongoose.model<IVerificationRequest>(
    'VerificationRequest',
    verificationRequestSchema
);
