const express = require('express');
const router = express.Router();
const { getLegal, updateLegal } = require('../controllers/legalController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/:type', getLegal);

// Admin
router.put('/:type', protect, authorize('Super Admin', 'Manager'), updateLegal);

module.exports = router;