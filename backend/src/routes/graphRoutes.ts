import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    getAuditTrailBySerialNumber,
    getMyAuditTrails,
    getGraphDebug,
    triggerBackfill,
} from '../controllers/graphController';

const router = Router();
router.use(authMiddleware);

router.get('/my-trails',                 getMyAuditTrails);
router.get('/audit-trail/:serialNumber', getAuditTrailBySerialNumber);
router.get('/debug',                     getGraphDebug);
router.post('/backfill',                 triggerBackfill);

export default router;
