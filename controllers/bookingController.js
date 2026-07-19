const Booking = require('../models/Booking');
const emailService = require('../utils/sendEmail');

// Public – create a booking (sends both company alert and customer confirmation)
exports.createBooking = async (req, res, next) => {
  try {
    const booking = await Booking.create(req.body);

    // Notify company (fire-and-forget)
    emailService.sendBookingAlert(booking).catch(err => console.error('Company alert failed:', err.message));

    // Send professional confirmation to customer (fire-and-forget)
    emailService.sendCustomerBookingConfirmation(booking).catch(err => console.error('Customer email failed:', err.message));

    res.status(201).json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// Admin – get all bookings
exports.getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().sort('-createdAt');
    res.json({ success: true, data: bookings });
  } catch (err) { next(err); }
};

// Admin – update booking status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, quotedPrice, adminNotes } = req.body;
    const update = { status };
    if (quotedPrice !== undefined) update.quotedPrice = quotedPrice;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;

    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Send status update email to customer
    if (['confirmed', 'completed', 'cancelled', 'contacted'].includes(status)) {
      emailService.sendBookingStatusUpdate(booking).catch(err => console.error('Status email failed:', err.message));
    }

    res.json({ success: true, data: booking });
  } catch (err) { next(err); }
};

// Admin – delete booking
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};