require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const cron = require('node-cron');
const PromotionBooking = require('./models/PromotionBooking');
const emailService = require('./utils/sendEmail');

// Connect to MongoDB
connectDB();

const app = express();

// ✅ TRUST PROXY – required for Render (and any proxy)
app.set('trust proxy', 1);

// CORS – allow your frontend URLs
app.use(cors({
  origin: [process.env.FRONTEND_URL, process.env.ADMIN_URL, 'http://localhost:5173'],
  credentials: true,
}));

// Rate limiting – returns JSON
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  },
});
app.use('/api', limiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (if you still serve local uploads – but Cloudinary is preferred)
app.use('/uploads', express.static('uploads'));

// Health check (required by Railway)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Debug endpoint – verify environment variables
app.get('/debug-env', (req, res) => {
  res.json({
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || 'missing',
    API_KEY: process.env.CLOUDINARY_API_KEY ? 'present' : 'missing',
    API_SECRET: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing',
    NODE_ENV: process.env.NODE_ENV || 'not set',
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/team', require('./routes/team'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/promotion-bookings', require('./routes/promotionBookings'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/settings', require('./routes/settings'));

// Error handling (must be last)
app.use(errorHandler);

// ---------- Saturday Promotion Reminder ----------
cron.schedule('0 7 * * 6', async () => {
  console.log('⏰ Running Saturday promotion email job...');
  try {
    const confirmed = await PromotionBooking.find({ status: 'confirmed' });
    if (confirmed.length === 0) return console.log('No confirmed bookings.');
    for (const b of confirmed) {
      await emailService.sendPromotionReminder(b).catch(err => console.error(`Failed: ${b.customerEmail}`, err.message));
      console.log(`✅ Reminder sent to ${b.customerEmail}`);
    }
  } catch (err) { console.error('Cron error:', err.message); }
}, { scheduled: true, timezone: 'Africa/Lagos' });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));