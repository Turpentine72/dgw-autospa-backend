require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false   // ✅ Bypass certificate validation (development only)
  }
});

transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Email configuration error:', err);
  } else {
    console.log('✅ Email configuration is correct and ready to send emails.');
  }
});