const Review = require('../models/Review');
const emailService = require('../utils/sendEmail');  // ← make sure this utility exists

// ------------------- PUBLIC -------------------
// Get approved reviews (optionally filtered by featured)
exports.getReviews = async (req, res, next) => {
  try {
    const filter = { status: 'approved' };
    if (req.query.featured === 'true') {
      filter.isFeatured = true;
    }
    const reviews = await Review.find(filter).sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

// Create a new review (public)
exports.createReview = async (req, res, next) => {
  try {
    const {
      customerName,
      customerEmail,
      rating,
      comment,
      service,
      clientRole,
      companyName,
      clientImage
    } = req.body;

    const review = await Review.create({
      customerName,
      customerEmail,
      rating,
      comment,
      service,
      clientRole,
      companyName,
      clientImage,
      isFeatured: false
    });

    // Fire-and-forget email alert
    if (emailService && emailService.sendNewReviewAlert) {
      emailService.sendNewReviewAlert(review).catch(err =>
        console.error('Review alert failed:', err.message)
      );
    }

    res.status(201).json({ success: true, data: review });
  } catch (err) { next(err); }
};

// ------------------- ADMIN -------------------
// Get ALL reviews (any status)
exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find().sort('-createdAt');
    res.json({ success: true, data: reviews });
  } catch (err) { next(err); }
};

// Approve a review
exports.approveReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    // Optional email notification
    if (emailService && emailService.sendReviewStatusUpdate) {
      emailService.sendReviewStatusUpdate(review, 'approved').catch(err =>
        console.error('Review status email failed:', err.message)
      );
    }
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Reject a review
exports.rejectReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    if (emailService && emailService.sendReviewStatusUpdate) {
      emailService.sendReviewStatusUpdate(review, 'rejected').catch(err =>
        console.error('Review status email failed:', err.message)
      );
    }
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Add reply to a review
exports.addReply = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reply: req.body.reply, repliedAt: new Date() },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    // Optional email
    if (emailService && emailService.sendReviewStatusUpdate) {
      emailService.sendReviewStatusUpdate(review, 'updated with a reply').catch(err =>
        console.error('Reply email failed:', err.message)
      );
    }
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};

// Delete a review
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// Toggle isFeatured (admin only)
exports.updateFeatured = async (req, res, next) => {
  try {
    const { isFeatured } = req.body; // boolean
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    );
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.json({ success: true, data: review });
  } catch (err) { next(err); }
};