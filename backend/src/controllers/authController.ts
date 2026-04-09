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

    // ── Validate input ──
    if (!name || !name.trim()) {
        throw new ValidationError('Full name is required.');
    }
    if (name.trim().length < 2) {
        throw new ValidationError('Name must be at least 2 characters.');
    }
    if (name.trim().length > 100) {
        throw new ValidationError('Name must not exceed 100 characters.');
    }
    if (!email || !email.trim()) {
        throw new ValidationError('Email address is required.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        throw new ValidationError('Please provide a valid email address.');
    }
    if (!password) {
        throw new ValidationError('Password is required.');
    }
    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters.');
    }
    if (password.length > 100) {
        throw new ValidationError('Password must not exceed 100 characters.');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
        throw new ConflictError('An account with this email already exists. Please sign in instead.');
    }

    // Create new user (mongoose ValidationError will be caught by centralized handler)
    const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
    });

    // Generate token
    const token = generateToken(user._id.toString());

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
        success: true,
        message: 'Account created successfully.',
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

    // ── Validate input ──
    if (!email || !email.trim()) {
        throw new ValidationError('Email address is required.');
    }
    if (!password) {
        throw new ValidationError('Password is required.');
    }

    // Find user and include password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

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
