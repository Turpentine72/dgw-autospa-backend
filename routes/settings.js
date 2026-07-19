const express = require('express');
const router = express.Router();
const {
  getSettings,
  getPublicSettings,
  updateSettings,
  changePassword,
  getSuperAdminEmail,
  updateSuperAdminEmail,
  updateProfile,
  getMailSettings,
  updateMailSettings,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

// public
router.get('/public', getPublicSettings);

// protected
router.get('/', protect, getSettings);
router.put('/', protect, authorize('Super Admin', 'Manager'), updateSettings);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.get('/super-admin-email', protect, authorize('Super Admin'), getSuperAdminEmail);
router.put('/super-admin-email', protect, authorize('Super Admin'), updateSuperAdminEmail);
router.get('/mail-settings', protect, getMailSettings);
router.put('/mail-settings', protect, updateMailSettings);

module.exports = router;