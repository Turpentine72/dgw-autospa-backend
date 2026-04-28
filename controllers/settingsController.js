const Settings = require('../models/Settings');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const emailService = require('../utils/sendEmail');
const { encrypt, decrypt } = require('../utils/cryptoUtils');

// protected – admin
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

// public – no auth required
exports.getPublicSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({
      success: true,
      data: {
        business: settings.business || {},
        hours: settings.hours || {},
      },
    });
  } catch (err) { next(err); }
};

exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (req.body.business) settings.business = req.body.business;
    if (req.body.hours) settings.hours = req.body.hours;
    if (req.body.notifications) settings.notifications = req.body.notifications;
    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();
    if (admin.role !== 'Super Admin') {
      await emailService.sendSuperAdminNotification(
        `Password Changed by ${admin.name} (${admin.role})`,
        `<p>${admin.name} (${admin.email}) has changed their password.</p>`
      );
    }
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) { next(err); }
};

exports.getSuperAdminEmail = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({ success: true, email: settings.superAdminEmail || '' });
  } catch (err) { next(err); }
};

exports.updateSuperAdminEmail = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    settings.superAdminEmail = req.body.superAdminEmail;
    await settings.save();
    res.json({ success: true, email: settings.superAdminEmail });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    const { name, phone } = req.body;
    if (name) admin.name = name;
    if (phone !== undefined) admin.phone = phone;
    await admin.save();
    if (admin.role !== 'Super Admin') {
      await emailService.sendSuperAdminNotification(
        `Profile Updated by ${admin.name} (${admin.role})`,
        `<p>${admin.name} (${admin.email}) updated their profile.</p>`
      );
    }
    const { password, ...updatedData } = admin.toObject();
    res.json({ success: true, data: updatedData });
  } catch (err) { next(err); }
};

exports.getMailSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json({
      success: true,
      mailUser: settings.mailUser || process.env.EMAIL_USER,
      hasPassword: !!settings.mailPassEncrypted,
    });
  } catch (err) { next(err); }
};

exports.updateMailSettings = async (req, res, next) => {
  try {
    const { mailUser, mailPass } = req.body;
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings();
    if (mailUser) settings.mailUser = mailUser;
    if (mailPass && mailPass.trim() !== '') {
      settings.mailPassEncrypted = encrypt(mailPass);
    }
    await settings.save();
    emailService._invalidateCache();
    res.json({ success: true, message: 'Email settings updated' });
  } catch (err) { next(err); }
};