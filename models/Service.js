const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String },
  isFeatured: { type: Boolean, default: false }   // ← new field
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);