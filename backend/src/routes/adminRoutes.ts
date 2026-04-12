import { Router } from 'express';
import {
    suspendUser,
    unsuspendUser,
    getUserDetails,
    getPlatformAnalytics,
    getVerificationLog,
    getAdminDisputes,
    addAdminMessage,
    resolveDispute
} from '../controllers/adminController';

const router = Router();
router.get('/ping', (req, res) => res.json({ message: 'pong' }));

router.get('/analytics',              getPlatformAnalytics);
router.get('/verifications',          getVerificationLog);
router.get('/users/:id/details',      getUserDetails);
router.patch('/users/:id/suspend',    suspendUser);
router.patch('/users/:id/unsuspend',  unsuspendUser);

router.get('/disputes',               getAdminDisputes);
router.post('/disputes/:id/message',  addAdminMessage);
router.patch('/disputes/:id/resolve', resolveDispute);

export default router;


