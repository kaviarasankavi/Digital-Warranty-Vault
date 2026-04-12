import express from 'express';
import { getUsers, updateEmail, updatePassword } from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Admin — list all users
router.get('/', getUsers);

// Authenticated user — update own email or password
router.patch('/me/email',    authMiddleware, updateEmail);
router.patch('/me/password', authMiddleware, updatePassword);

export default router;
