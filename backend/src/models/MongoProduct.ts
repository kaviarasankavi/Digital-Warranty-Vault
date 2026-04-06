import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoProduct extends Document {
    userId: string;
    name: string;
    brand: string;
    modelName: string;
    serialNumber: string;
    category: string;
    purchaseDate: Date;
    purchasePrice: number;
    warrantyExpiry: Date;
    status: 'active' | 'expired' | 'claimed';
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const mongoProductSchema = new Schema<IMongoProduct>(
    {
        userId: {
            type: String,
            required: [true, 'User ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        brand: {
            type: String,
            default: '',
            trim: true,
        },
        modelName: {
            type: String,
            default: '',
            trim: true,
        },
        serialNumber: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            default: '',
            index: true,
        },
        purchaseDate: {
            type: Date,
            default: Date.now,
        },
        purchasePrice: {
            type: Number,
            default: 0,
            min: 0,
        },
        warrantyExpiry: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['active', 'expired', 'claimed'],
            default: 'active',
        },
        notes: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for aggregation pipeline performance
mongoProductSchema.index({ userId: 1, category: 1 });
mongoProductSchema.index({ userId: 1, brand: 1 });
mongoProductSchema.index({ userId: 1, purchaseDate: 1 });
mongoProductSchema.index({ userId: 1, purchasePrice: 1 });

export const MongoProduct = mongoose.model<IMongoProduct>('MongoProduct', mongoProductSchema);
