import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError, ValidationError, AuthorizationError } from '../utils/errors';
import { Dispute } from '../models/Dispute';
import { WarrantyClaim } from '../models/WarrantyClaim';
import { VerificationRequest } from '../models/VerificationRequest';

// ── Open a new dispute ────────────────────────────────────────────────────────
export const openDispute = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const { referenceId, referenceType, text } = req.body;
        const userId = req.user?.id;
        const userName = req.user?.name;

        if (!userId || !userName) throw new AuthorizationError('Authentication required.');
        if (!referenceId || !referenceType || !text) throw new ValidationError('Missing required fields.');

        // Check if dispute already exists
        const existing = await Dispute.findOne({ referenceId });
        if (existing) throw new ValidationError('This item is already under dispute.');

        let productName = '';
        let brand = '';
        let vendorEmail = '';

        if (referenceType === 'claim') {
            const claim = await WarrantyClaim.findById(referenceId);
            if (!claim) throw new NotFoundError('Claim not found.');
            if (claim.userId !== userId) throw new AuthorizationError('You do not own this claim.');
            if (claim.status !== 'rejected') throw new ValidationError('You can only dispute a rejected claim.');

            claim.isEscalated = true;
            await claim.save();

            productName = claim.productName;
            brand = claim.brand;
            vendorEmail = claim.vendorEmail;

        } else if (referenceType === 'verification') {
            const verify = await VerificationRequest.findById(referenceId);
            if (!verify) throw new NotFoundError('Verification request not found.');
            if (verify.userId !== userId) throw new AuthorizationError('You do not own this request.');
            if (verify.status !== 'rejected') throw new ValidationError('You can only dispute a rejected request.');

            verify.isEscalated = true;
            await verify.save();

            productName = verify.productName;
            brand = verify.brand;
            vendorEmail = verify.vendorEmail;
        } else {
            throw new ValidationError('Invalid reference type.');
        }

        const dispute = new Dispute({
            referenceId,
            referenceType,
            productName,
            brand,
            userId,
            userName,
            vendorEmail,
            messages: [{
                sender: 'user',
                senderName: userName,
                text,
                timestamp: new Date()
            }]
        });

        await dispute.save();

        res.status(201).json({ success: true, data: dispute });
    }
);

// ── Add a message to an existing dispute ──────────────────────────────────────
export const addMessage = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const { text } = req.body;
        if (!text) throw new ValidationError('Message text is required.');

        const dispute = await Dispute.findById(req.params.id);
        if (!dispute) throw new NotFoundError('Dispute not found.');

        if (dispute.status !== 'open') {
            throw new ValidationError('Cannot add message to a resolved dispute.');
        }

        let senderRole: 'user' | 'vendor' | 'admin';
        let senderName = req.user?.name || 'Unknown';

        // Authorize and determine sender type
        if (req.user?.role === 'user') {
            if (dispute.userId !== req.user.id) throw new AuthorizationError('Access denied.');
            senderRole = 'user';
        } else if (req.user?.role === 'vendor') {
            if (dispute.vendorEmail !== req.user.email) throw new AuthorizationError('Access denied.');
            senderRole = 'vendor';
        } else {
            throw new AuthorizationError('Access denied.'); // Admin messages handled in adminController
        }

        dispute.messages.push({
            sender: senderRole,
            senderName,
            text,
            timestamp: new Date()
        });

        await dispute.save();
        res.json({ success: true, data: dispute });
    }
);

// ── Get User's Disputes ───────────────────────────────────────────────────────
export const getMyDisputes = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const disputes = await Dispute.find({ userId: req.user?.id }).sort({ updatedAt: -1 });
        res.json({ success: true, data: disputes });
    }
);

// ── Get Vendor's Disputes ─────────────────────────────────────────────────────
export const getVendorDisputes = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const disputes = await Dispute.find({ vendorEmail: req.user?.email }).sort({ updatedAt: -1 });
        res.json({ success: true, data: disputes });
    }
);
