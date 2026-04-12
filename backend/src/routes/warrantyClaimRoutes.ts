import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    submitClaim,
    getMyClaims,
    getVendorClaims,
    getVendorClaimCount,
    scheduleClaim,
    completeClaim,
    rejectClaim,
} from '../controllers/warrantyClaimController';

const router = Router();
router.use(authMiddleware);

// User
router.post('/',                 submitClaim);
router.get('/my-claims',         getMyClaims);

// Vendor
router.get('/vendor-claims',         getVendorClaims);
router.get('/vendor-claims/count',   getVendorClaimCount);
router.patch('/:id/schedule',        scheduleClaim);
router.patch('/:id/complete',        completeClaim);
router.patch('/:id/reject',          rejectClaim);

export default router;
