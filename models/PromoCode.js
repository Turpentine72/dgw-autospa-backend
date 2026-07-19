const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date }, // optional expiration
  maxUses: { type: Number, default: 0 }, // 0 = unlimited
  usedCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PromoCode', promoCodeSchema);