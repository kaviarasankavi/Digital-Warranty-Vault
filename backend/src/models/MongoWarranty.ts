import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoWarranty extends Document {
    productId: mongoose.Types.ObjectId;
    userId: string;
    warrantyType: 'standard' | 'extended' | 'premium';
    status: 'active' | 'expired' | 'expiring';
    startDate: Date;
    endDate: Date;
    claimCount: number;
    coverageDetails: {
        parts: boolean;
        labor: boolean;
        accidentalDamage: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const mongoWarrantySchema = new Schema<IMongoWarranty>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'MongoProduct',
            required: true,
        },
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            index: true,
        },
        warrantyType: {
            type: String,
            enum: ['standard', 'extended', 'premium'],
            default: 'standard',
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'expiring'],
            default: 'active',
            index: true,
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        claimCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        coverageDetails: {
            parts: { type: Boolean, default: true },
            labor: { type: Boolean, default: true },
            accidentalDamage: { type: Boolean, default: false },
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for aggregation pipeline performance
mongoWarrantySchema.index({ userId: 1, status: 1 });
mongoWarrantySchema.index({ userId: 1, warrantyType: 1 });
mongoWarrantySchema.index({ userId: 1, endDate: 1 });

export const MongoWarranty = mongoose.model<IMongoWarranty>('MongoWarranty', mongoWarrantySchema);
