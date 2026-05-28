import express from 'express';
const router = express.Router();
import passport from 'passport';
import {
  register, login, refreshToken, googleCallback,
  verifyEmail, forgotPassword, resetPassword, getMe, logout,
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  googleCallback
);

export default router;