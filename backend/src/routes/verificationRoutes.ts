import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware';
import {
    createVerificationRequest,
    getMyRequests,
    getVendorRequests,
    getVendorPendingCount,
    verifyRequest,
    rejectRequest,
} from '../controllers/verificationController';

const router = Router();

// All routes require a logged-in user (user or vendor)
router.use(authenticate);

// User routes
router.post('/request',      createVerificationRequest);
router.get('/my-requests',   getMyRequests);

// Vendor routes
router.get('/vendor-requests',        getVendorRequests);
router.get('/vendor-requests/count',  getVendorPendingCount);
router.patch('/requests/:id/verify',  verifyRequest);
router.patch('/requests/:id/reject',  rejectRequest);

export default router;
