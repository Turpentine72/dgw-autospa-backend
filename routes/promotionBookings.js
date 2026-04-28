const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getStats, updateStatus, deleteBooking } = require('../controllers/promotionController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', protect, authorize('Super Admin', 'Manager'), getBookings);
router.get('/stats', protect, authorize('Super Admin', 'Manager'), getStats);
router.put('/:id/status', protect, authorize('Super Admin', 'Manager'), updateStatus);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deleteBooking);

module.exports = router;