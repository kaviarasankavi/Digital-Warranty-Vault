import { Router } from 'express';
import {
    getActiveAnnouncements,
    getAllAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    toggleAnnouncement,
} from '../controllers/announcementController';

const router = Router();

// Public route — no auth needed (for landing page)
router.get('/active', getActiveAnnouncements);

// Admin routes (no server-side auth — admin auth is client-side in this project)
router.get('/', getAllAnnouncements);
router.post('/', createAnnouncement);
router.put('/:id', updateAnnouncement);
router.delete('/:id', deleteAnnouncement);
router.patch('/:id/toggle', toggleAnnouncement);

export default router;
