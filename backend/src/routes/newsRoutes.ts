import { Router } from 'express';
import {
    getActiveNews,
    getAllNews,
    getNewsById,
    createNews,
    updateNews,
    deleteNews,
} from '../controllers/newsController';

const router = Router();

// Public route — no auth needed (for landing page)
router.get('/active', getActiveNews);
router.get('/:id', getNewsById);

// Admin routes (no server-side auth — admin auth is client-side in this project)
router.get('/', getAllNews);
router.post('/', createNews);
router.put('/:id', updateNews);
router.delete('/:id', deleteNews);

export default router;
