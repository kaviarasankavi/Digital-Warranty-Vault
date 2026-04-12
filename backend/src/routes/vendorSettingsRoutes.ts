import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    getVendorSettings,
    updateProfile,
    changePassword,
    updateBusiness,
    updateNotifications,
} from '../controllers/vendorSettingsController';

const router = Router();
router.use(authMiddleware);

router.get('/',                      getVendorSettings);
router.put('/profile',               updateProfile);
router.put('/password',              changePassword);
router.put('/business',              updateBusiness);
router.put('/notifications',         updateNotifications);

export default router;
