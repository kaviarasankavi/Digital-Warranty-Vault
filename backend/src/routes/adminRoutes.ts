import { Router } from 'express';
import {
    suspendUser,
    unsuspendUser,
    getUserDetails,
    getPlatformAnalytics,
} from '../controllers/adminController';

const router = Router();

router.get('/analytics',              getPlatformAnalytics);
router.get('/users/:id/details',      getUserDetails);
router.patch('/users/:id/suspend',    suspendUser);
router.patch('/users/:id/unsuspend',  unsuspendUser);

export default router;

