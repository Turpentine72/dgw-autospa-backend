const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  service: { type: String },
  subject: { type: String },
  message: { type: String, required: true },
  reply: { type: String },
  repliedAt: { type: Date },
  status: { type: String, enum: ['pending', 'replied'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);