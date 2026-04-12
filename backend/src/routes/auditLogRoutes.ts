import { Router } from 'express';
import { getAuditLogs, getAuditLogStats } from '../controllers/auditLogController';

const router = Router();

router.get('/', getAuditLogs);
router.get('/stats', getAuditLogStats);

export default router;
