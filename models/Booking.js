const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  serviceName: { type: String, required: true },
  servicePrice: { type: Number, default: 0 },
  quotedPrice: { type: Number },
  date: { type: String, required: true },
  time: { type: String, required: true },
  notes: { type: String },
  adminNotes: { type: String },
  status: { type: String, enum: ['pending', 'contacted', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);