const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['Super Admin', 'Manager', 'Staff'], default: 'Staff' },
  hasSetSecurityQuestions: { type: Boolean, default: false },   // not used now
  refreshToken: { type: String },

  // OTP fields
  resetPasswordOTP: { type: String },
  resetPasswordOTPExpires: { type: Date },

  // Email change fields
  newEmail: { type: String },
  emailChangeOTP: { type: String },
  emailChangeOTPExpires: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Admin', adminSchema);