const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  service: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reply: { type: String },
  repliedAt: { type: Date },

  // 👇 NEW FIELDS for richer testimonials
  clientRole: { type: String },
  companyName: { type: String },
  clientImage: { type: String },
  isFeatured: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);