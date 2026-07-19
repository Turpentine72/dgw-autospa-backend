const PromotionBooking = require('../models/PromotionBooking');
const Settings = require('../models/Settings');
const emailService = require('../utils/sendEmail');

// ---------- Public: create a promotion booking ----------
// The Free Wheel promotion now has exactly one code (MYFREEWHEEL) and is
// applied automatically — customers never type a code. Whether booking is
// currently allowed is controlled entirely by Settings.promotion.enabled,
// managed from the admin Promotion Settings page.
exports.createBooking = async (req, res, next) => {
  try {
    const { promoCode, ...bookingData } = req.body; // promoCode ignored if sent by an old cached frontend

    const settings = await Settings.findOne();
    const promo = settings?.promotion || {};

    if (promo.enabled === false) {
      return res.status(400).json({ success: false, message: 'The Free Wheel promotion is not currently active. Please check back later.' });
    }

    const booking = await PromotionBooking.create({
      ...bookingData,
      promoCode: promo.promoCode || 'MYFREEWHEEL',
    });

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