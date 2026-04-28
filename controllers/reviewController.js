const Review = require('../models/Review');
const emailService = require('../utils/sendEmail');

// Public: ONLY approved reviews (homepage uses this)
exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ status: 'approved' }).sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

// Public: submit a new review
exports.createReview = async (req, res, next) => {
  try {
    const review = await Review.create(req.body);
    // Fire‑and‑forget email – never crash the request
    emailService.sendNewReviewAlert(review).catch(err => console.error('Review alert failed:', err.message));
    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Admin: get ALL reviews (any status)
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

// Admin: approve a review
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    emailService.sendReviewStatusUpdate(review, 'approved').catch(err => console.error('Review status email failed:', err.message));
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Admin: reject a review
exports.rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    emailService.sendReviewStatusUpdate(review, 'rejected').catch(err => console.error('Review status email failed:', err.message));
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Admin: add reply to a review
exports.addReply = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reply: req.body.reply, repliedAt: new Date() },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    emailService.sendReviewStatusUpdate(review, 'updated with a reply').catch(err => console.error('Reply email failed:', err.message));
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Admin: delete a review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};