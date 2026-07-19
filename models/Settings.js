const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  business: { type: Object, default: {} },
  hours: { type: Object, default: {} },
  // Free Wheel promotion settings — deliberately separate from `hours`
  // (general business hours). These must never be conflated: `hours` is
  // when the shop is normally open; `promotion` is only for the Free Wheel
  // Saturday-style campaign and can say something completely different.
  promotion: {
    type: Object,
    default: {
      enabled: true,
      days: 'Monday - Friday',
      startTime: '10:00',
      endTime: '16:00',
      text: 'FREE WHEEL ALIGNMENT AVAILABLE',
      promoCode: 'MYFREEWHEEL',
    },
  },
  notifications: { type: Object, default: {} },
  superAdminEmail: { type: String, default: '' },

  // Email sending credentials (password stored encrypted)
  mailUser: { type: String, default: '' },
  mailPassEncrypted: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);