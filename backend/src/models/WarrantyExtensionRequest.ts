import mongoose, { Document, Schema } from 'mongoose';

export type ExtensionStatus = 'pending' | 'approved' | 'denied';

export interface IWarrantyExtensionRequest extends Document {
    productId:       number;
    productName:     string;
    brand:           string;
    serialNumber:    string;
    userId:          string;
    userName:        string;
    userEmail:       string;
    vendorEmail:     string;
    currentExpiry:   Date | null;
    requestedExpiry: Date | null;   // user's suggested new date (optional)
    reason:          string;
    status:          ExtensionStatus;
    newExpiry:       Date | null;   // vendor-set approved date
    vendorNote:      string;
    requestedAt:     Date;
    resolvedAt:      Date | null;
}

const schema = new Schema<IWarrantyExtensionRequest>(
    {
        productId:       { type: Number,  required: true },
        productName:     { type: String,  required: true },
        brand:           { type: String,  required: true },
        serialNumber:    { type: String,  default: '' },
        userId:          { type: String,  required: true },
        userName:        { type: String,  required: true },
        userEmail:       { type: String,  required: true },
        vendorEmail:     { type: String,  required: true },
        currentExpiry:   { type: Date,    default: null },
        requestedExpiry: { type: Date,    default: null },
        reason:          { type: String,  default: '' },
        status:          { type: String,  enum: ['pending','approved','denied'], default: 'pending' },
        newExpiry:       { type: Date,    default: null },
        vendorNote:      { type: String,  default: '' },
        requestedAt:     { type: Date,    default: () => new Date() },
        resolvedAt:      { type: Date,    default: null },
    },
    { timestamps: true }
);

schema.index({ userId: 1 });
schema.index({ vendorEmail: 1, status: 1 });
schema.index({ productId: 1, userId: 1 });

export const WarrantyExtensionRequest = mongoose.model<IWarrantyExtensionRequest>(
    'WarrantyExtensionRequest',
    schema
);
