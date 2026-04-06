import { Router } from 'express';
import {
    registerProduct,
    transferOwnership,
    bulkUpdateWarrantyStatus,
    purgeExpiredProducts,
    getProductReport,
} from '../controllers/procedureController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected
router.use(authMiddleware);

// Register product via stored procedure
router.post('/register-product', registerProduct);

// Transfer product ownership
router.post('/transfer-ownership', transferOwnership);

// Bulk recalculate warranty statuses
router.post('/bulk-update-warranty', bulkUpdateWarrantyStatus);

// Archive and purge expired products
router.post('/purge-expired', purgeExpiredProducts);

// Get aggregated product report
router.get('/product-report', getProductReport);

export default router;
