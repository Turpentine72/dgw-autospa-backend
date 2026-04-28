const express = require('express');
const router = express.Router();
const {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  loginAs
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Super Admin'), getAdmins);
router.post('/', protect, authorize('Super Admin'), createAdmin);
router.put('/:id', protect, authorize('Super Admin'), updateAdmin);
router.delete('/:id', protect, authorize('Super Admin'), deleteAdmin);
router.post('/login-as/:id', protect, loginAs);   // for impersonation

module.exports = router;