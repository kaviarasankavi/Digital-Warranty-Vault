import mongoose, { Document, Schema } from 'mongoose';

export interface IMongoNewsArticle extends Document {
    title: string;
    summary: string;
    content: string;
    author: string;
    imageUrl: string;
    status: 'draft' | 'published' | 'archived';
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const mongoNewsArticleSchema = new Schema<IMongoNewsArticle>(
    {
        title: {
            type: String,
            required: [true, 'News title is required'],
            trim: true,
        },
        summary: {
            type: String,
            required: [true, 'News summary is required'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'News content is required'],
        },
        author: {
            type: String,
            default: 'Admin',
            trim: true,
        },
        imageUrl: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true,
        },
        publishedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for frequently querying published articles efficiently
mongoNewsArticleSchema.index({ status: 1, publishedAt: -1 });

export const MongoNewsArticle = mongoose.model<IMongoNewsArticle>('MongoNewsArticle', mongoNewsArticleSchema);
