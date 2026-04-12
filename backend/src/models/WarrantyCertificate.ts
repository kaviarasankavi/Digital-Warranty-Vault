import mongoose, { Document, Schema } from 'mongoose';

export interface IWarrantyCertificate extends Document {
    certificateId:        string;          // e.g. CERT-OBQ12X-A3F
    verificationRequestId: string;         // ref to VerificationRequest._id
    productId:            number;
    productName:          string;
    brand:                string;
    model:                string;
    serialNumber:         string;
    userId:               string;
    userName:             string;
    userEmail:            string;
    vendorEmail:          string;
    vendorNote:           string;
    verifiedAt:           Date;
    isValid:              boolean;
    issuedAt:             Date;
}

const schema = new Schema<IWarrantyCertificate>(
    {
        certificateId:         { type: String, required: true, unique: true },
        verificationRequestId: { type: String, required: true },
        productId:             { type: Number, required: true },
        productName:           { type: String, required: true },
        brand:                 { type: String, required: true },
        model:                 { type: String, default: '' },
        serialNumber:          { type: String, default: '' },
        userId:                { type: String, required: true },
        userName:              { type: String, required: true },
        userEmail:             { type: String, required: true },
        vendorEmail:           { type: String, required: true },
        vendorNote:            { type: String, default: '' },
        verifiedAt:            { type: Date,   required: true },
        isValid:               { type: Boolean, default: true },
        issuedAt:              { type: Date,   default: () => new Date() },
    },
    { timestamps: true }
);

schema.index({ userId: 1 });
schema.index({ verificationRequestId: 1 }, { unique: true });

function generateCertId(): string {
    const ts  = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `CERT-${ts}-${rnd}`;
}

schema.path('certificateId').default(generateCertId);

export const WarrantyCertificate = mongoose.model<IWarrantyCertificate>(
    'WarrantyCertificate',
    schema
);

export { generateCertId };
