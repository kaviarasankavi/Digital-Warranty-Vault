import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';

// Generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, env.JWT_SECRET, {
        expiresIn: 3600, // 1 hour in seconds
    });
};

// Register new user
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide name, email, and password.',
            });
            return;
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            res.status(400).json({
                success: false,
                message: 'User with this email already exists.',
            });
            return;
        }

        // Create new user
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
    } catch (error: any) {
        logger.error('Registration error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e: any) => e.message);
            res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
            return;
        }

        res.status(500).json({
            success: false,
            message: 'Server error during registration.',
        });
    }
};

// Login user
export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: 'Please provide email and password.',
            });
            return;
        }

        // Find user and include password for comparison
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
            return;
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            res.status(401).json({
                success: false,
                message: 'Invalid email or password.',
            });
            return;
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
    } catch (error: any) {
        logger.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login.',
        });
    }
};

// Get current user profile
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found.',
            });
            return;
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
    } catch (error: any) {
        logger.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching profile.',
        });
    }
};
