const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const emailService = require('../utils/sendEmail');

// Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    res.json({
      success: true,
      token,
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        hasSetSecurityQuestions: admin.hasSetSecurityQuestions,
      }
    });
  } catch (err) { next(err); }
};

// Get current logged-in admin
exports.getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('-password');
    res.json({ success: true, data: admin });
  } catch (err) { next(err); }
};

// Forgot password – send OTP
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(404).json({ success: false, message: 'No account with this email.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    admin.resetPasswordOTP = otp;
    admin.resetPasswordOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await admin.save();

    await emailService.sendOTP(admin.email, otp, 'password reset');

    // Notify Super Admin if a Manager/Staff requested a reset
    if (admin.role !== 'Super Admin') {
      await emailService.sendSuperAdminNotification(
        `Password Reset Attempt by ${admin.name} (${admin.role})`,
        `<p>${admin.name} (${admin.email}) has requested a password reset OTP.</p>`
      );
    }

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) { next(err); }
};

// Reset password with OTP
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const admin = await Admin.findOne({
      email: email.toLowerCase(),
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: { $gt: Date.now() }
    });
    if (!admin) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    admin.password = await bcrypt.hash(newPassword, 10);
    admin.resetPasswordOTP = undefined;
    admin.resetPasswordOTPExpires = undefined;
    await admin.save();

    // Notify Super Admin if a Manager/Staff reset their password
    if (admin.role !== 'Super Admin') {
      await emailService.sendSuperAdminNotification(
        `Password Reset Completed by ${admin.name} (${admin.role})`,
        `<p>${admin.name} (${admin.email}) has successfully reset their password.</p>`
      );
    }

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};

// Request email change (send OTP to new email)
exports.requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    const currentAdmin = await Admin.findById(req.admin._id);
    if (!currentAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    // Check if new email already used
    const existing = await Admin.findOne({ email: newEmail.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'This email is already in use.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    currentAdmin.newEmail = newEmail;
    currentAdmin.emailChangeOTP = otp;
    currentAdmin.emailChangeOTPExpires = Date.now() + 10 * 60 * 1000;
    await currentAdmin.save();

    await emailService.sendEmailChangeVerification(newEmail, otp);

    res.json({ success: true, message: 'OTP sent to new email. Please verify.' });
  } catch (err) { next(err); }
};

// Confirm email change with OTP
exports.confirmEmailChange = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const currentAdmin = await Admin.findById(req.admin._id);
    if (!currentAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (
      currentAdmin.emailChangeOTP !== otp ||
      Date.now() > currentAdmin.emailChangeOTPExpires
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    const oldEmail = currentAdmin.email;
    currentAdmin.email = currentAdmin.newEmail;
    currentAdmin.newEmail = undefined;
    currentAdmin.emailChangeOTP = undefined;
    currentAdmin.emailChangeOTPExpires = undefined;
    await currentAdmin.save();

    // Notify Super Admin if a non‑Super Admin changed their email
    if (currentAdmin.role !== 'Super Admin') {
      await emailService.sendSuperAdminNotification(
        `Email Changed by ${currentAdmin.name} (${currentAdmin.role})`,
        `<p>${currentAdmin.name} changed their email from <strong>${oldEmail}</strong> to <strong>${currentAdmin.email}</strong>.</p>`
      );
    }

    res.json({ success: true, message: 'Email address updated successfully.' });
  } catch (err) { next(err); }
};