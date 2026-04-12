import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    suspendUser,
    unsuspendUser,
    getUserDetails,
    getPlatformAnalytics,
} from '../controllers/adminController';

const router = Router();
router.use(authMiddleware);

router.get('/analytics',              getPlatformAnalytics);
router.get('/users/:id/details',      getUserDetails);
router.patch('/users/:id/suspend',    suspendUser);
router.patch('/users/:id/unsuspend',  unsuspendUser);

export default router;
