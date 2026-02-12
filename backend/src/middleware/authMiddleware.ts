import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.',
            });
            return;
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error: any) {
        logger.error('Auth middleware error:', error);

        if (error.name === 'JsonWebTokenError') {
            res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
            return;
        }

        if (error.name === 'TokenExpiredError') {
            res.status(401).json({
                success: false,
                message: 'Token expired.',
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Server error during authentication.',
        });
    }
};
