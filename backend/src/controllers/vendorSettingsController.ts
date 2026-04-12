import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { ValidationError, AuthorizationError, AuthenticationError } from '../utils/errors';
import { VendorProfile } from '../models/VendorProfile';
import { User } from '../models/User';

const BRAND_FROM_EMAIL: Record<string, string> = {
    'vendor@samsung.vault':     'Samsung',
    'vendor@dell.vault':        'Dell',
    'vendor@jbl.vault':         'JBL',
    'vendor@firebolt.vault':    'FireBolt',
    'vendor@sony.vault':        'Sony',
    'vendor@lg.vault':          'LG',
    'vendor@apple.vault':       'Apple',
};

/** Ensure vendor profile doc exists (upsert on first request) */
async function getOrCreateProfile(userId: string, email: string) {
    const brand = BRAND_FROM_EMAIL[email] ?? '';
    let profile = await VendorProfile.findOne({ userId });
    if (!profile) {
        profile = await VendorProfile.create({
            userId,
            email,
            displayName: BRAND_FROM_EMAIL[email] ? `${BRAND_FROM_EMAIL[email]} Support` : '',
            brand,
        });
    }
    return profile;
}

// ── GET /api/vendor/settings ────────────────────────────────────────────────
export const getVendorSettings = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const profile = await getOrCreateProfile(String(user._id), user.email);

        // Return vendor public info + profile (never password)
        res.json({
            success: true,
            data: {
                name:     user.name,
                email:    user.email,
                ...profile.toObject(),
            },
        });
    }
);

// ── PUT /api/vendor/settings/profile ────────────────────────────────────────
export const updateProfile = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { name, displayName, logoUrl } = req.body;

        if (name && name.trim().length < 2)
            throw new ValidationError('Name must be at least 2 characters.');

        // Update User name in MongoDB
        if (name?.trim()) {
            await User.findByIdAndUpdate(user._id, { name: name.trim() });
        }

        const profile = await getOrCreateProfile(String(user._id), user.email);
        if (displayName !== undefined) profile.displayName = displayName.trim();
        if (logoUrl     !== undefined) profile.logoUrl     = logoUrl.trim();
        await profile.save();

        res.json({ success: true, message: 'Profile updated successfully.' });
    }
);

// ── PUT /api/vendor/settings/password ────────────────────────────────────────
export const changePassword = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const { currentPassword, newPassword, confirmPassword } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword)
            throw new ValidationError('currentPassword, newPassword, and confirmPassword are required.');

        if (newPassword.length < 6)
            throw new ValidationError('New password must be at least 6 characters.');

        if (newPassword !== confirmPassword)
            throw new ValidationError('New password and confirm password do not match.');

        // Fetch user with password (select: false by default)
        const userWithPw = await User.findById(user._id).select('+password');
        if (!userWithPw) throw new AuthenticationError('User not found.');

        const isMatch = await userWithPw.comparePassword(currentPassword);
        if (!isMatch) throw new AuthenticationError('Current password is incorrect.');

        if (currentPassword === newPassword)
            throw new ValidationError('New password must be different from current password.');

        userWithPw.password = newPassword; // pre-save hook will bcrypt it
        await userWithPw.save();

        res.json({ success: true, message: 'Password changed successfully.' });
    }
);

// ── PUT /api/vendor/settings/business ────────────────────────────────────────
export const updateBusiness = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const {
            companyName, address, city, state, pincode, country,
            website, supportPhone, supportEmail, gstNumber, description,
        } = req.body;

        const profile = await getOrCreateProfile(String(user._id), user.email);

        const b = profile.business as any;
        if (companyName  !== undefined) b.companyName  = companyName.trim();
        if (address      !== undefined) b.address      = address.trim();
        if (city         !== undefined) b.city         = city.trim();
        if (state        !== undefined) b.state        = state.trim();
        if (pincode      !== undefined) b.pincode      = pincode.trim();
        if (country      !== undefined) b.country      = country.trim();
        if (website      !== undefined) b.website      = website.trim();
        if (supportPhone !== undefined) b.supportPhone = supportPhone.trim();
        if (supportEmail !== undefined) b.supportEmail = supportEmail.trim();
        if (gstNumber    !== undefined) b.gstNumber    = gstNumber.trim();
        if (description  !== undefined) b.description  = description.trim();

        profile.markModified('business');
        await profile.save();

        res.json({ success: true, message: 'Business details updated.' });
    }
);

// ── PUT /api/vendor/settings/notifications ───────────────────────────────────
export const updateNotifications = asyncHandler(
    async (req: AuthRequest, res: Response): Promise<void> => {
        const user = req.user!;
        if (user.role !== 'vendor') throw new AuthorizationError('Vendor accounts only.');

        const {
            newVerificationRequest, extensionRequest,
            repairClaim, claimScheduled, emailDigest,
        } = req.body;

        const profile = await getOrCreateProfile(String(user._id), user.email);
        const n = profile.notifications as any;

        if (newVerificationRequest !== undefined) n.newVerificationRequest = Boolean(newVerificationRequest);
        if (extensionRequest       !== undefined) n.extensionRequest       = Boolean(extensionRequest);
        if (repairClaim            !== undefined) n.repairClaim            = Boolean(repairClaim);
        if (claimScheduled         !== undefined) n.claimScheduled         = Boolean(claimScheduled);
        if (emailDigest            !== undefined) n.emailDigest            = Boolean(emailDigest);

        profile.markModified('notifications');
        await profile.save();

        res.json({ success: true, message: 'Notification preferences saved.' });
    }
);
