import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { connectMongoDB } from './config/database';
import { initSQLite } from './config/database-sqlite';
import { logger } from './utils/logger';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// Start server
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectMongoDB();

        // Initialize SQLite for products
        initSQLite();

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
