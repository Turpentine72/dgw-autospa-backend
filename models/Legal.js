const mongoose = require('mongoose');

const legalSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['terms', 'privacy'],
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Legal', legalSchema);