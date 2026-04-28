const PromotionBooking = require('../models/PromotionBooking');

exports.createBooking = async (req, res, next) => {
  try {
    const booking = await PromotionBooking.create(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

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
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const total = await PromotionBooking.countDocuments();
    const pending = await PromotionBooking.countDocuments({ status: 'pending' });
    const confirmed = await PromotionBooking.countDocuments({ status: 'confirmed' });
    const completed = await PromotionBooking.countDocuments({ status: 'completed' });
    const cancelled = await PromotionBooking.countDocuments({ status: 'cancelled' });
    res.json({ success: true, data: { total, pending, confirmed, completed, cancelled } });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const booking = await PromotionBooking.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await PromotionBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};

exports.createBooking = async (req, res, next) => {
  try {
    const booking = await PromotionBooking.create(req.body);
    // Send alert to company
    await emailService.sendEmail({
      email: process.env.COMPANY_EMAIL,
      subject: 'New Promotion Booking',
      html: `<p>Customer: ${booking.customerName}<br>Date: ${booking.date} ${booking.time}</p>`
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const booking = await PromotionBooking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!booking) return res.status(404)
    if (['confirmed', 'completed', 'cancelled'].includes(req.body.status)) {
      await emailService.sendEmail({
        email: booking.customerEmail,
        subject: `Promotion Booking ${req.body.status}`,
        html: `<p>Your promotion booking for ${booking.date} at ${booking.time} is ${req.body.status}.</p>`
      });
    }
    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};