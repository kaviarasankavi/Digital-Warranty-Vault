import { Request, Response } from 'express';
import { MongoNewsArticle } from '../models/MongoNewsArticle';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../utils/errors';

// ─── PUBLIC: Get all published news ──────────────────────────────────────────
export const getActiveNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const limit = parseInt(req.query.limit as string) || 10;

    const news = await MongoNewsArticle.find({ status: 'published' })
        .sort({ publishedAt: -1, createdAt: -1 })
        .limit(limit);

    res.json({
        success: true,
        data: news,
    });
});

// ─── PUBLIC: Get single news by id ───────────────────────────────────────────
export const getNewsById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const news = await MongoNewsArticle.findById(id);

    if (!news) {
        throw new AppError('News article not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        data: news,
    });
});

// ─── ADMIN: Get all news (including drafts) ──────────────────────────────────
export const getAllNews = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const news = await MongoNewsArticle.find().sort({ createdAt: -1 });

    res.json({
        success: true,
        data: news,
    });
});

// ─── ADMIN: Create news ──────────────────────────────────────────────────────
export const createNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { title, summary, content, author, imageUrl, status } = req.body;

    if (!title || !summary || !content) {
        throw new AppError('Title, summary, and content are required', 400, 'VALIDATION_ERROR');
    }

    const newsData: any = {
        title,
        summary,
        content,
        author: author || 'Admin',
        imageUrl: imageUrl || '',
        status: status || 'draft',
    };

    if (newsData.status === 'published') {
        newsData.publishedAt = new Date();
    }

    const news = await MongoNewsArticle.create(newsData);

    res.status(201).json({
        success: true,
        message: 'News article created successfully',
        data: news,
    });
});

// ─── ADMIN: Update news ──────────────────────────────────────────────────────
export const updateNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, summary, content, author, imageUrl, status } = req.body;

    const news = await MongoNewsArticle.findById(id);

    if (!news) {
        throw new AppError('News article not found', 404, 'NOT_FOUND');
    }

    const wasPublished = news.status === 'published';
    const isPublishing = status === 'published';

    news.title = title || news.title;
    news.summary = summary || news.summary;
    news.content = content || news.content;
    if (author !== undefined) news.author = author;
    if (imageUrl !== undefined) news.imageUrl = imageUrl;
    
    if (status && status !== news.status) {
        news.status = status;
        if (!wasPublished && isPublishing) {
            news.publishedAt = new Date();
        }
    }

    await news.save();

    res.json({
        success: true,
        message: 'News article updated successfully',
        data: news,
    });
});

// ─── ADMIN: Delete news ──────────────────────────────────────────────────────
export const deleteNews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    const news = await MongoNewsArticle.findByIdAndDelete(id);

    if (!news) {
        throw new AppError('News article not found', 404, 'NOT_FOUND');
    }

    res.json({
        success: true,
        message: 'News article deleted successfully',
    });
});
