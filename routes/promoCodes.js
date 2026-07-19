const express = require('express');
const router = express.Router();
const {
  createPromoCode, getPromoCodes, updatePromoCode, deletePromoCode, validateCode
} = require('../controllers/promoCodeController');
const { protect, authorize } = require('../middleware/auth');

// Admin routes
router.post('/', protect, authorize('Super Admin', 'Manager'), createPromoCode);
router.get('/', protect, authorize('Super Admin', 'Manager'), getPromoCodes);
router.put('/:id', protect, authorize('Super Admin', 'Manager'), updatePromoCode);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deletePromoCode);

// Public validation endpoint (optional)
router.get('/validate/:code', validateCode);

module.exports = router;