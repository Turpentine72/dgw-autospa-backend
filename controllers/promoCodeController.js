const PromoCode = require('../models/PromoCode');

exports.createPromoCode = async (req, res, next) => {
  try {
    const { code, description, isActive, validUntil, maxUses } = req.body;
    const promo = await PromoCode.create({ code, description, isActive, validUntil, maxUses });
    res.status(201).json({ success: true, data: promo });
  } catch (err) { next(err); }
};

exports.getPromoCodes = async (req, res, next) => {
  try {
    const codes = await PromoCode.find().sort('-createdAt');
    res.json({ success: true, data: codes });
  } catch (err) { next(err); }
};

exports.updatePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Promo code not found' });
    res.json({ success: true, data: promo });
  } catch (err) { next(err); }
};

exports.deletePromoCode = async (req, res, next) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) return res.status(404).json({ success: false, message: 'Promo code not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};

// Public validation (optional, used by frontend to check code validity before booking)
exports.validateCode = async (req, res, next) => {
  try {
    const { code } = req.params;
    const promo = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });
    if (!promo) return res.status(404).json({ success: false, message: 'Invalid or expired promo code' });
    if (promo.validUntil && new Date() > promo.validUntil) {
      return res.status(400).json({ success: false, message: 'Promo code has expired' });
    }
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
    }
    res.json({ success: true, data: { code: promo.code, description: promo.description } });
  } catch (err) { next(err); }
};