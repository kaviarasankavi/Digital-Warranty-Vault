import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    openDispute,
    addMessage,
    getMyDisputes,
    getVendorDisputes,
} from '../controllers/disputeController';

const router = Router();
router.use(authMiddleware);

// User and Vendor routes
router.post('/', openDispute);
router.post('/:id/message', addMessage);
router.get('/my-disputes', getMyDisputes);
router.get('/vendor-disputes', getVendorDisputes);

export default router;
