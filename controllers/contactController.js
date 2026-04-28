const Contact = require('../models/Contact');
const emailService = require('../utils/sendEmail');

// Public – submit contact form
exports.sendMessage = async (req, res, next) => {
  try {
    const contact = await Contact.create(req.body);

    // Notify company email (non‑blocking)
    emailService.sendContactAlert(contact).catch(err => console.error('Contact alert failed:', err.message));

    res.status(201).json({ success: true, data: contact });
  } catch (err) { next(err); }
};

// Admin – fetch all contacts
exports.getContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find().sort('-createdAt');
    res.json({ success: true, data: contacts });
  } catch (err) { next(err); }
};

// Admin – add reply and send email to client
exports.addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });

    contact.reply = reply;
    contact.repliedAt = new Date();
    contact.status = 'replied';
    await contact.save();

    // Send professional reply email to customer (non‑blocking)
    emailService.sendContactReply(contact).catch(err => console.error('Reply email failed:', err.message));

    res.json({ success: true, data: contact });
  } catch (err) { next(err); }
};

// Admin – delete contact
exports.deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return res.status(404).json({ success: false, message: 'Contact not found' });
    res.json({ success: true, data: {} });
  } catch (err) { next(err); }
};