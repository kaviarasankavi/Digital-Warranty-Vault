import { Router } from 'express';
import { getAuditLogs, getAuditLogStats } from '../controllers/auditLogController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All audit routes are protected
router.use(authMiddleware);

router.get('/', getAuditLogs);
router.get('/stats', getAuditLogStats);

export default router;
