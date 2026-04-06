import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser } from '../models/User';
import { AuthenticationError } from '../utils/errors';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const authMiddleware = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AuthenticationError('Access denied. No token provided.');
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        let decoded: { userId: string };
        try {
            decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
        } catch (jwtError: any) {
            if (jwtError.name === 'TokenExpiredError') {
                throw new AuthenticationError('Token expired. Please log in again.');
            }
            throw new AuthenticationError('Invalid token.');
        }

        // Get user from database
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AuthenticationError('Invalid token. User not found.');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
