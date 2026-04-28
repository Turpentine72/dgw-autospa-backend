const mongoose = require('mongoose');

const promotionBookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  adminNotes: { type: String },
  promoCode: { type: String, default: 'MYFREEWHEEL' },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('PromotionBooking', promotionBookingSchema);