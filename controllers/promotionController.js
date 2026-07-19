const PromotionBooking = require('../models/PromotionBooking');
const PromoCode = require('../models/PromoCode');
const emailService = require('../utils/sendEmail');

// ---------- Public: create a promotion booking ----------
exports.createBooking = async (req, res, next) => {
  try {
    const { promoCode, ...bookingData } = req.body;

    // Validate promo code
    if (!promoCode) {
      return res.status(400).json({ success: false, message: 'Promo code is required' });
    }

    const code = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });
    if (!code) {
      return res.status(400).json({ success: false, message: 'Invalid promo code' });
    }
    if (code.validUntil && new Date() > code.validUntil) {
      return res.status(400).json({ success: false, message: 'Promo code has expired' });
    }
    if (code.maxUses > 0 && code.usedCount >= code.maxUses) {
      return res.status(400).json({ success: false, message: 'Promo code usage limit reached' });
    }

    // Create booking with the validated promo code
    const booking = await PromotionBooking.create({ ...bookingData, promoCode: code.code });

    // Increment used count if limited
    if (code.maxUses > 0) {
      code.usedCount += 1;
      await code.save();
    }

    // Fire‑and‑forget emails – never crash the request
    emailService.sendPromotionBookingEmail(booking.customerEmail, booking.customerName, booking, booking.status)
      .catch(err => console.error('Promo customer email failed:', err.message));

    emailService.sendBookingAlert(booking)
      .catch(err => console.error('Promo company alert failed:', err.message));

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: get bookings ----------
exports.getBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      const search = req.query.search;
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }
    const bookings = await PromotionBooking.find(filter).sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: get stats ----------
exports.getStats = async (req, res, next) => {
  try {
    const total = await PromotionBooking.countDocuments();
    const pending = await PromotionBooking.countDocuments({ status: 'pending' });
    const confirmed = await PromotionBooking.countDocuments({ status: 'confirmed' });
    const completed = await PromotionBooking.countDocuments({ status: 'completed' });
    const cancelled = await PromotionBooking.countDocuments({ status: 'cancelled' });
    res.json({ success: true, data: { total, pending, confirmed, completed, cancelled } });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: update booking status ----------
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await PromotionBooking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Send status update email to customer
    if (['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      emailService.sendPromotionBookingEmail(booking.customerEmail, booking.customerName, booking, status)
        .catch(err => console.error('Promo status email failed:', err.message));
    }

    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

// ---------- Admin: delete booking ----------
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await PromotionBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
};