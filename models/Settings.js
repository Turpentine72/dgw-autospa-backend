const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  business: { type: Object, default: {} },
  hours: { type: Object, default: {} },
  notifications: { type: Object, default: {} },
  superAdminEmail: { type: String, default: '' },

  // Email sending credentials (password stored encrypted)
  mailUser: { type: String, default: '' },
  mailPassEncrypted: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);