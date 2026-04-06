import { Router } from 'express';
import {
    getCategorySummary,
    getWarrantyStatus,
    getMonthlySpending,
    getBrandAnalytics,
    getPriceDistribution,
} from '../controllers/analyticsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All analytics routes require authentication
router.use(authMiddleware);

// MongoDB Aggregation Pipeline Endpoints ($match → $group → $project)
router.get('/category-summary', getCategorySummary);
router.get('/warranty-status', getWarrantyStatus);
router.get('/monthly-spending', getMonthlySpending);
router.get('/brand-analytics', getBrandAnalytics);
router.get('/price-distribution', getPriceDistribution);

export default router;
