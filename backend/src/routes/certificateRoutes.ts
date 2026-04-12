import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import {
    getMyCertificates,
    downloadCertificate,
    previewCertificate,
} from '../controllers/certificateController';

const router = Router();
router.use(authMiddleware);

router.get('/',                       getMyCertificates);
router.get('/:id/download',           downloadCertificate);
router.get('/:id/preview',            previewCertificate);

export default router;
