const express = require('express');
const router = express.Router();
const {
  login, getMe, forgotPassword, resetPassword,
  requestEmailChange, confirmEmailChange
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);

// OTP based password reset
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Email change (protected)
router.put('/change-email-request', protect, requestEmailChange);
router.put('/change-email-confirm', protect, confirmEmailChange);

module.exports = router;