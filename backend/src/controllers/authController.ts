import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
    ValidationError,
    AuthenticationError,
    ConflictError,
} from '../utils/errors';

// Generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, env.JWT_SECRET, {
        expiresIn: 3600, // 1 hour in seconds
    });
};

// Register new user
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        throw new ValidationError('Please provide name, email, and password.');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
        throw new ConflictError('User with this email already exists.');
    }

    // Create new user (mongoose ValidationError will be caught by centralized handler)
    const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            token,
        },
    });
});

// Login user
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        throw new ValidationError('Please provide email and password.');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        throw new AuthenticationError('Invalid email or password.');
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        throw new AuthenticationError('Invalid email or password.');
    }

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`User logged in: ${email}`);

    res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
            token,
        },
    });
});

// Get current user profile
export const getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user;

    if (!user) {
        throw new AuthenticationError('User not found.');
    }

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                createdAt: user.createdAt,
            },
        },
    });
});
