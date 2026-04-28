const express = require('express');
const router = express.Router();
const {
  getReviews,
  createReview,
  getAllReviews,
  approveReview,
  rejectReview,
  addReply,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getReviews);
router.post('/', createReview);
router.post('/:id/reply', protect, authorize('Super Admin', 'Manager'), addReply);
router.get('/admin', protect, authorize('Super Admin', 'Manager'), getAllReviews);
router.put('/:id/approve', protect, authorize('Super Admin', 'Manager'), approveReview);
router.put('/:id/reject', protect, authorize('Super Admin', 'Manager'), rejectReview);
router.post('/:id/reply', protect, authorize('Super Admin', 'Manager'), addReply);
router.delete('/:id', protect, authorize('Super Admin', 'Manager'), deleteReview);

module.exports = router;