import mongoose, { Document, Schema } from 'mongoose';

export type DisputeStatus = 'open' | 'resolved_user' | 'resolved_vendor';
export type ReferenceType = 'claim' | 'verification';
export type MessageSender = 'user' | 'vendor' | 'admin';

export interface IDisputeMessage {
    sender: MessageSender;
    senderName: string;
    text: string;
    timestamp: Date;
}

export interface IDispute extends Document {
    referenceId: string;
    referenceType: ReferenceType;
    
    // De-normalized product info for easy list views
    productName: string;
    brand: string;

    userId: string;
    userName: string;
    vendorEmail: string;

    status: DisputeStatus;
    messages: IDisputeMessage[];

    resolutionReason: string;

    createdAt: Date;
    updatedAt: Date;
}

const messageSchema = new Schema<IDisputeMessage>(
    {
        sender: { type: String, enum: ['user', 'vendor', 'admin'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: () => new Date() }
    },
    { _id: false }
);

const disputeSchema = new Schema<IDispute>(
    {
        referenceId:   { type: String, required: true },
        referenceType: { type: String, enum: ['claim', 'verification'], required: true },
        
        productName:   { type: String, required: true },
        brand:         { type: String, required: true },

        userId:        { type: String, required: true },
        userName:      { type: String, required: true },
        vendorEmail:   { type: String, required: true },

        status:        { type: String, enum: ['open', 'resolved_user', 'resolved_vendor'], default: 'open' },
        messages:      { type: [messageSchema], default: [] },
        
        resolutionReason: { type: String, default: '' },
    },
    { timestamps: true }
);

// Indexes for fast lookups
disputeSchema.index({ userId: 1, status: 1 });
disputeSchema.index({ vendorEmail: 1, status: 1 });
disputeSchema.index({ referenceId: 1 }, { unique: true });

export const Dispute = mongoose.model<IDispute>('Dispute', disputeSchema);
