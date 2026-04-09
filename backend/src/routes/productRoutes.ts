import { Router } from 'express';
import {
    getProducts,
    getProduct,
    getProductHistory,
    getCategories,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/:id', getProduct);
router.get('/:id/history', getProductHistory);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;

