const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBookingStatus,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', protect, authorize('Super Admin', 'Manager', 'Staff'), getBookings);
router.put('/:id/status', protect, authorize('Super Admin', 'Manager', 'Staff'), updateBookingStatus);
router.delete('/:id', protect, authorize('Super Admin'), deleteBooking);

module.exports = router;