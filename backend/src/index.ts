import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectMongoDB } from './config/database';
import { initPostgres } from './config/database-postgres';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import triggerRoutes from './routes/triggerRoutes';
import procedureRoutes from './routes/procedureRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import announcementRoutes from './routes/announcementRoutes';
import newsRoutes from './routes/newsRoutes';
import { initMySQL } from './config/database-mysql';
import verificationRoutes from './routes/verificationRoutes';
import warrantyExtensionRoutes from './routes/warrantyExtensionRoutes';
import warrantyClaimRoutes from './routes/warrantyClaimRoutes';
import certificateRoutes from './routes/certificateRoutes';
import vendorSettingsRoutes from './routes/vendorSettingsRoutes';

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'WarrantyVault API is running' });
});

import userRoutes from './routes/userRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/triggers', triggerRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/verify', verificationRoutes);
app.use('/api/warranty-extension', warrantyExtensionRoutes);
app.use('/api/claims', warrantyClaimRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/vendor/settings', vendorSettingsRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        errorCode: 'NOT_FOUND',
        message: `Route ${req.originalUrl} not found`,
    });
});

// ─── Centralized Error Handler ────────────────────────────────────────
app.use((err: Error | AppError, req: express.Request, res: express.Response, _next: express.NextFunction) => {

    // --- Operational errors (our custom AppError hierarchy) ---
    if (err instanceof AppError) {
        logger.warn(`[${err.errorCode}] ${err.message}`);
        res.status(err.statusCode).json({
            success: false,
            errorCode: err.errorCode,
            message: err.message,
            ...(env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
        });
        return;
    }

    // --- Mongoose Validation Errors ---
    if (err.name === 'ValidationError') {
        const messages = Object.values((err as any).errors || {}).map((e: any) => e.message);
        logger.warn(`[MONGOOSE_VALIDATION] ${messages.join(', ')}`);
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: messages.join(', ') || 'Validation failed',
        });
        return;
    }

    // --- Mongoose CastError (invalid ObjectId, etc.) ---
    if (err.name === 'CastError') {
        logger.warn(`[CAST_ERROR] ${err.message}`);
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: 'Invalid ID format',
        });
        return;
    }

    // --- Mongoose Duplicate Key (11000) ---
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        logger.warn(`[DUPLICATE_KEY] Duplicate value for: ${field}`);
        res.status(409).json({
            success: false,
            errorCode: 'CONFLICT',
            message: `Duplicate value for: ${field}`,
        });
        return;
    }

    // --- JSON SyntaxError (malformed request body) ---
    if (err instanceof SyntaxError && 'body' in err) {
        logger.warn(`[JSON_PARSE_ERROR] ${err.message}`);
        res.status(400).json({
            success: false,
            errorCode: 'VALIDATION_ERROR',
            message: 'Malformed JSON in request body',
        });
        return;
    }

    // --- Unexpected / Programming Errors ---
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        errorCode: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'development' ? err.message : 'Internal server error',
        ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
});

// ─── Process-Level Exception Handlers ─────────────────────────────────
process.on('unhandledRejection', (reason: Error) => {
    logger.error('UNHANDLED REJECTION:', reason);
    // In production, you may want to gracefully shut down
});

process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT EXCEPTION:', error);
    // Graceful shutdown — let existing requests finish, then exit
    process.exit(1);
});

// ─── Start Server ─────────────────────────────────────────────────────
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectMongoDB();

        // Initialize PostgreSQL (Neon) for products
        await initPostgres();

        // Initialize MySQL for audit logging
        await initMySQL();

        app.listen(env.PORT, () => {
            logger.info(`Server running on port ${env.PORT}`);
            logger.info(`Environment: ${env.NODE_ENV}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
