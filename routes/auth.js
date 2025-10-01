const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.post('/register/journalist', upload.single('license'), authController.registerJournalist);
router.post('/register/comms', authController.registerComms);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Debug route (remove in production)
router.get('/debug/token/:token', authController.debugToken);

// Protected routes
router.get('/me', protect, authController.getMe);

// Placeholder routes for future implementation
router.post('/register/invite', (req, res) => {
  res.status(501).json({ success: false, message: 'Invite registration not implemented' });
});

router.post('/register/endorsement', upload.single('endorsementFile'), (req, res) => {
  res.status(501).json({ success: false, message: 'Endorsement registration not implemented' });
});

router.post('/approve-endorsement', protect, (req, res) => {
  res.status(501).json({ success: false, message: 'Endorsement approval not implemented' });
});

module.exports = router;