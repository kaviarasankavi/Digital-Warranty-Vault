import { Router } from 'express';
import {
    getAuditLogs,
    getWarrantyStatuses,
    getPriceHistory,
    getTriggerSummary,
} from '../controllers/triggerController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected
router.use(authMiddleware);

// Audit log
router.get('/audit-log', getAuditLogs);

// Warranty status (auto-computed by trigger)
router.get('/warranty-status', getWarrantyStatuses);

// Price change history for a specific product
router.get('/price-history/:productId', getPriceHistory);

// Summary dashboard data
router.get('/summary', getTriggerSummary);

export default router;
