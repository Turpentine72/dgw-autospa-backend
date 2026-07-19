const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  description: { type: String },
  email: { type: String },
  phone: { type: String },
  image: { type: String },
  order: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);