import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    createExtensionRequest,
    getMyExtensionRequests,
    getVendorExtensionRequests,
    getVendorExtensionPendingCount,
    approveExtensionRequest,
    denyExtensionRequest,
} from '../controllers/warrantyExtensionController';

const router = Router();

router.use(authMiddleware);

// User routes
router.post('/request',         createExtensionRequest);
router.get('/my-requests',      getMyExtensionRequests);

// Vendor routes
router.get('/vendor-requests',          getVendorExtensionRequests);
router.get('/vendor-requests/count',    getVendorExtensionPendingCount);
router.patch('/requests/:id/approve',   approveExtensionRequest);
router.patch('/requests/:id/deny',      denyExtensionRequest);

export default router;
