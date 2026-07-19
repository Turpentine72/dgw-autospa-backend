const axios = require('axios');
const cron = require('node-cron');
const Booking = require('../models/Booking');
const PromoCode = require('../models/PromoCode');   // <-- added for dynamic promo code

const Settings = require('../models/Settings');

// ---------- Helper to get admin email ----------
// NOTE: this previously required('../models/Setting') (singular), which does
// not exist — the model file is Settings.js. That meant this always threw,
// silently fell back to process.env.SUPER_ADMIN_EMAIL, and the Settings
// panel's "Admin Notification Email" was never actually used. Fixed below.
const getAdminEmail = async () => {
    try {
        const settings = await Settings.findOne();
        return settings?.superAdminEmail || process.env.SUPER_ADMIN_EMAIL;
    } catch (error) {
        console.error('Error getting admin email:', error);
        return process.env.SUPER_ADMIN_EMAIL;
    }
};

// ---------- Helper to get live business info for email templates ----------
// Cached briefly in memory so we don't hit the DB on every single email send.
// Cache is cleared immediately whenever Settings are saved (see
// _invalidateCache, called from settingsController.updateSettings).
let _businessInfoCache = null;
let _businessInfoCacheAt = 0;
const BUSINESS_INFO_CACHE_TTL_MS = 60 * 1000;

const DEFAULT_BUSINESS_INFO = {
    businessName: 'DGW Autospa',
    tagline: 'Deep Gleam On Wheels',
    email: process.env.EMAIL_FROM || 'deepgleamonwheels@gmail.com',
    phone: '+234 702 588 7213',
    address: '4, Ibrahim Odofin Street, Idado Estate, Lekki, Lagos',
    website: process.env.FRONTEND_URL || '',
    logo: null,
};

const getBusinessInfo = async () => {
    const now = Date.now();
    if (_businessInfoCache && (now - _businessInfoCacheAt) < BUSINESS_INFO_CACHE_TTL_MS) {
        return _businessInfoCache;
    }
    try {
        const settings = await Settings.findOne();
        const b = settings?.business || {};
        _businessInfoCache = {
            businessName: b.businessName || DEFAULT_BUSINESS_INFO.businessName,
            tagline: b.tagline || DEFAULT_BUSINESS_INFO.tagline,
            email: b.email || DEFAULT_BUSINESS_INFO.email,
            phone: b.phone || DEFAULT_BUSINESS_INFO.phone,
            address: b.address || DEFAULT_BUSINESS_INFO.address,
            website: b.website || DEFAULT_BUSINESS_INFO.website,
            logo: b.logo || null,
        };
        _businessInfoCacheAt = now;
    } catch (error) {
        console.error('Error getting business info, using defaults:', error.message);
        if (!_businessInfoCache) _businessInfoCache = { ...DEFAULT_BUSINESS_INFO };
    }
    return _businessInfoCache;
};

// Called by settingsController.updateSettings whenever Business settings are
// saved, so emails reflect the change immediately instead of waiting up to
// 60 seconds for the cache to expire.
const _invalidateCache = () => {
    _businessInfoCache = null;
    _businessInfoCacheAt = 0;
};

// ---------- Shared branded header/footer ----------
// Every email template below is built as: emailHeader() + <content> + emailFooter()
// so the logo, business name, tagline, address, phone, and copyright all stay
// perfectly consistent and update everywhere the instant Settings changes.
const emailHeader = (info, subtitle = '') => `
  <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px 30px; text-align: center;">
    ${info.logo
      ? `<img src="${info.logo}" alt="${info.businessName}" style="max-height:56px; max-width:220px; object-fit:contain; margin-bottom:12px;" />`
      : `<h1 style="color:#ffffff; margin:0; font-size:26px; letter-spacing:0.5px; font-family:Arial,sans-serif;">${info.businessName}</h1>`
    }
    ${subtitle ? `<p style="color:#bfdbfe; margin:6px 0 0; font-size:12px; letter-spacing:0.8px; text-transform:uppercase; font-family:Arial,sans-serif;">${subtitle}</p>` : ''}
  </div>
`;

const emailFooter = (info) => `
  <div style="background:#f9fafb; padding:24px 30px; text-align:center; border-top:1px solid #e5e7eb; font-family:Arial,sans-serif;">
    <p style="margin:0 0 4px; font-size:13px; color:#374151; font-weight:700;">${info.businessName}</p>
    ${info.tagline ? `<p style="margin:0 0 12px; font-size:10px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.6px;">${info.tagline}</p>` : ''}
    <p style="margin:0 0 3px; font-size:12px; color:#6b7280;">${info.address}</p>
    <p style="margin:0 0 14px; font-size:12px; color:#6b7280;">${info.phone}${info.email ? ` &bull; ${info.email}` : ''}</p>
    <p style="margin:0; font-size:11px; color:#9ca3af;">&copy; ${new Date().getFullYear()} ${info.businessName}. All rights reserved.</p>
  </div>
`;

// Wraps any inner content in the standard rounded card container used by
// every template, so margins/shadow/border-radius stay identical everywhere.
const emailWrap = (innerHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    ${innerHtml}
  </div>
`;

// ---------- Core sendEmail using Brevo API ----------
const sendEmail = async (to, subject, html) => {
    console.log(`📧 Attempting to send email to: ${to}, subject: ${subject}`);

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error('❌ BREVO_API_KEY is missing!');
        throw new Error('Missing BREVO_API_KEY environment variable');
    }
    if (!process.env.EMAIL_FROM) {
        console.error('❌ EMAIL_FROM is missing!');
        throw new Error('Missing EMAIL_FROM environment variable');
    }

    const info = await getBusinessInfo();
    const data = {
        sender: { name: info.businessName, email: process.env.EMAIL_FROM },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
    };

    try {
        console.log('📤 Sending request to Brevo API...');
        const response = await axios.post('https://api.brevo.com/v3/smtp/email', data, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
            },
        });
        console.log('✅ Email sent successfully. Brevo response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Brevo API error:', error.response?.data || error.message);
        throw error;
    }
};

// ---------- Password Reset Email ----------
const sendResetEmail = async (toEmail, resetToken, userName) => {
    const info = await getBusinessInfo();
    const adminUrl = process.env.ADMIN_URL || info.website;
    const resetUrl = `${adminUrl}/admin/reset-password?token=${resetToken}`;
    const html = emailWrap(`
        ${emailHeader(info, 'Password Reset')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>You requested a password reset for your ${info.businessName} admin account.</p>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Reset My Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in <strong>1 hour</strong>.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
        ${emailFooter(info)}
    `);
    try {
        await sendEmail(toEmail, `🔐 Password Reset Request - ${info.businessName}`, html);
    } catch (err) {
        console.error('Failed to send reset email:', err.message);
    }
};

// ---------- Booking Status Email ----------
const sendBookingStatusEmail = async (toEmail, customerName, bookingDetails, status) => {
    const statusMessages = {
        pending: { subject: '📋 Booking Request Received', message: 'We have received your booking request and will review it shortly. We\'ll contact you within 24 hours with pricing and confirmation.' },
        contacted: { subject: '📞 We\'ve Reviewed Your Request', message: 'We have reviewed your request and will contact you shortly with pricing details. Our team will reach out via phone or email.' },
        confirmed: { subject: '✅ Booking Confirmed', message: 'Your booking has been confirmed! We look forward to serving you. Please arrive 10 minutes before your scheduled time.' },
        completed: { subject: '🎉 Service Completed', message: 'Your service has been completed. Thank you for choosing DGW Autospa! We hope you\'re satisfied with our service.' },
        cancelled: { subject: '❌ Booking Cancelled', message: 'Your booking has been cancelled as requested. We hope to serve you again in the future.' }
    };
    const info = statusMessages[status] || statusMessages.pending;
    const biz = await getBusinessInfo();
    const bookingDate = new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = emailWrap(`
        ${emailHeader(biz, 'Booking Update')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${info.subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${info.message.replace('DGW Autospa', biz.businessName)}</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td style="padding: 8px 0;">${bookingDetails.serviceName}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="padding: 8px 0;">${bookingDate}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">${bookingDetails.time}</td></tr>
                ${bookingDetails.quotedPrice ? `<tr><td style="padding: 8px 0;"><strong>Quote:</strong></td><td style="padding: 8px 0;">₦${bookingDetails.quotedPrice.toLocaleString()}</td></tr>` : ''}
            </table>
            </div>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(toEmail, info.subject, html);
    } catch (err) {
        console.error('Failed to send booking status email:', err.message);
    }
};

// ---------- Review Status Email ----------
const sendReviewStatusEmail = async (customerEmail, customerName, status, reviewComment, replyMessage = null) => {
    const isApproved = status === 'approved';
    const subject = isApproved ? '⭐ Your Review Has Been Approved' : '📝 Update on Your Review Submission';
    const biz = await getBusinessInfo();
    const html = emailWrap(`
        ${emailHeader(biz, 'Customer Feedback')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${isApproved ? 'Thank you for your feedback! Your review has been approved and published on our website.' : 'Thank you for your feedback. Unfortunately, your review was not published at this time.'}</p>
            ${replyMessage ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>📝 Our response:</strong></p><p>${replyMessage}</p></div>` : ''}
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">We value your feedback and look forward to serving you again!</p>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(customerEmail, subject, html);
    } catch (err) {
        console.error('Failed to send review status email:', err.message);
    }
};

// ---------- Contact Auto‑Reply ----------
const sendContactAutoReply = async (toEmail, customerName) => {
    const biz = await getBusinessInfo();
    const html = emailWrap(`
        ${emailHeader(biz, 'Thank You For Contacting Us')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Thank you for reaching out to ${biz.businessName}. We have received your message and will get back to you within <strong>24 hours</strong> with pricing and availability.</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📞 Need immediate assistance?</strong></p>
            <p>Call us at: <strong>${biz.phone}</strong><br>Visit us at: <strong>${biz.address}</strong></p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 20px 0 0;">We look forward to serving you!</p>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(toEmail, `📧 We Received Your Message - ${biz.businessName}`, html);
    } catch (err) {
        console.error('Failed to send contact auto-reply:', err.message);
    }
};

// ---------- Promotion Booking Email (DYNAMIC PROMO CODE) ----------
const sendPromotionBookingEmail = async (customerEmail, customerName, bookingDetails, status) => {
    const statusMessages = {
        pending: { subject: '🎁 FREE Wheel Service Booking Received', message: 'Your FREE Wheel Service booking has been received. We\'ll confirm your slot soon.' },
        confirmed: { subject: '✅ FREE Wheel Service Booking Confirmed', message: 'Your FREE Wheel Service booking is confirmed! We look forward to seeing you.' },
        completed: { subject: '🎉 FREE Wheel Service Completed', message: 'Your FREE Wheel Service has been completed. Thank you for choosing DGW Autospa!' },
        cancelled: { subject: '❌ Promotion Booking Cancelled', message: 'Your promotion booking has been cancelled. Please contact us if this was a mistake.' }
    };
    const info = statusMessages[status] || statusMessages.pending;
    const biz = await getBusinessInfo();
    const formattedDate = new Date(bookingDetails.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const html = emailWrap(`
        ${emailHeader(biz, 'Saturday Promotion — Free Wheel Service')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <h2 style="color: #1e3a8a; margin-top: 0;">${info.subject}</h2>
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>${info.message.replace('DGW Autospa', biz.businessName)}</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e3a8a;">Booking Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0;"><strong>Service:</strong></td><td style="padding: 8px 0;">FREE Wheel Service (Balancing & Alignment Check)</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Date:</strong></td><td style="padding: 8px 0;">${formattedDate}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">${bookingDetails.time}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Promo Code:</strong></td><td style="padding: 8px 0;"><strong style="color: #2563eb;">${bookingDetails.promoCode || 'MYFREEWHEEL'}</strong></td></tr>
            </table>
            </div>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(customerEmail, info.subject, html);
    } catch (err) {
        console.error('Failed to send promotion booking email:', err.message);
    }
};

// ---------- Get customers for promotion campaign ----------
const getCustomerEmails = async () => {
    const customers = await Booking.aggregate([
        { $match: { status: { $in: ['confirmed', 'completed'] }, customerEmail: { $exists: true, $ne: null } } },
        { $group: { _id: '$customerEmail', name: { $first: '$customerName' }, lastBooking: { $max: '$date' } } }
    ]);
    return customers;
};

// ---------- Saturday Promotion (single) – now accepts promoCode ----------
const sendSaturdayPromotionEmail = async (customerEmail, customerName, promoCode = 'MYFREEWHEEL') => {
    const biz = await getBusinessInfo();
    const frontendUrl = process.env.FRONTEND_URL || biz.website;
    const bookingUrl = `${frontendUrl}/free-wheel-service`;
    const html = emailWrap(`
        ${emailHeader(biz, 'Limited Time Offer')}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>As a valued customer, we're offering you a <strong style="color: #2563eb;">FREE Wheel Service</strong> this Saturday!</p>
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="font-size: 28px; font-weight: bold; color: #1e3a8a; margin: 0;">${promoCode}</p>
            <p style="color: #6b7280; margin: 5px 0 0;">Use this code when booking</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${bookingUrl}" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Book Your Free Service</a>
            </div>
            <p style="color: #6b7280; font-size: 12px;">✓ Includes: Wheel Balancing (4 wheels) • Alignment Check • Tyre Pressure Optimization</p>
            <p style="color: #9ca3af; font-size: 12px;">This offer is valid every Saturday from 10AM - 4PM. Terms and conditions apply.</p>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(customerEmail, '🎁 FREE WHEEL SERVICE THIS SATURDAY!', html);
        console.log(`✅ Saturday promo sent to ${customerEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send to ${customerEmail}:`, error.message);
        return false;
    }
};

// ---------- Saturday Promotion to All (fetches latest promo code) ----------
const sendSaturdayPromotionToAll = async () => {
    console.log('📧 Starting Saturday promotion campaign...');
    try {
        // Fetch the latest active promo code from DB
        const latestPromo = await PromoCode.findOne({ isActive: true }).sort({ createdAt: -1 });
        const promoCode = latestPromo ? latestPromo.code : 'MYFREEWHEEL';
        
        const customers = await getCustomerEmails();
        let successCount = 0, failCount = 0;
        for (const customer of customers) {
            const success = await sendSaturdayPromotionEmail(customer._id, customer.name, promoCode);
            success ? successCount++ : failCount++;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`📊 Campaign completed: ${successCount} sent, ${failCount} failed`);
        return { total: customers.length, sent: successCount, failed: failCount };
    } catch (error) {
        console.error('❌ Promotion campaign failed:', error);
        return { total: 0, sent: 0, failed: 0, error: error.message };
    }
};

// ---------- Cron Scheduler ----------
const startScheduler = () => {
    cron.schedule('0 8 * * 6', async () => {
        console.log('🕐 Running scheduled Saturday promotion...');
        await sendSaturdayPromotionToAll();
    }, { timezone: "Africa/Lagos", scheduled: true });
    console.log('📅 Saturday promotion scheduler started! (Runs every Saturday at 8:00 AM Nigeria time)');
};

// ---------- Welcome Email ----------
const sendWelcomeEmail = async (toEmail, customerName) => {
    const biz = await getBusinessInfo();
    const html = emailWrap(`
        ${emailHeader(biz, `Welcome to ${biz.businessName}`)}
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            <p>Dear <strong>${customerName}</strong>,</p>
            <p>Welcome to the ${biz.businessName} family! We're excited to have you on board.</p>
            <p>As a valued customer, you'll receive:</p>
            <ul><li>Exclusive promotions and discounts</li><li>Priority booking for our FREE Saturday Wheel Service</li><li>Expert automotive care tips</li></ul>
            <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || biz.website}/services" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Explore Our Services</a>
            </div>
        </div>
        ${emailFooter(biz)}
    `);
    try {
        await sendEmail(toEmail, `👋 Welcome to ${biz.businessName} Family!`, html);
    } catch (err) {
        console.error('Failed to send welcome email:', err.message);
    }
};

// ========== NEW WRAPPER FUNCTIONS FOR CONTROLLERS ==========
const getCompanyEmail = () => process.env.COMPANY_EMAIL || process.env.EMAIL_FROM;

const sendContactAlert = async (contact) => {
    const subject = `📧 New Contact Message from ${contact.name}`;
    const html = `<h2>New Contact Message</h2><p><strong>Name:</strong> ${contact.name}</p><p><strong>Email:</strong> ${contact.email}</p><p><strong>Message:</strong><br/>${contact.message}</p>`;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
        console.log(`Contact alert sent for ${contact.name}`);
    } catch (error) {
        console.error('sendContactAlert failed:', error.message);
    }
};

const sendCustomerBookingConfirmation = async (booking) => {
    const subject = `🎉 Booking Received – ${booking.serviceName}`;
    const html = `<h2>Thank you, ${booking.customerName}!</h2><p>Your booking for ${booking.serviceName} has been received.</p>`;
    try {
        await sendEmail(booking.customerEmail, subject, html);
    } catch (error) {
        console.error('sendCustomerBookingConfirmation failed:', error.message);
    }
};

const sendBookingAlert = async (booking) => {
    const subject = `🚗 New Booking: ${booking.serviceName}`;
    const html = `<h2>New Booking</h2><p><strong>Customer:</strong> ${booking.customerName}</p><p><strong>Service:</strong> ${booking.serviceName}</p>`;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
    } catch (error) {
        console.error('sendBookingAlert failed:', error.message);
    }
};

const sendBookingStatusUpdate = async (booking) => {
    try {
        await sendBookingStatusEmail(booking.customerEmail, booking.customerName, booking, booking.status);
    } catch (error) {
        console.error('sendBookingStatusUpdate failed:', error.message);
    }
};

const sendReviewStatusUpdate = async (review, status) => {
    try {
        await sendReviewStatusEmail(review.customerEmail, review.customerName, status, review.comment, review.reply);
    } catch (error) {
        console.error('sendReviewStatusUpdate failed:', error.message);
    }
};

const sendOTP = async (email, otp, purpose) => {
    const html = `<h2>OTP: <strong>${otp}</strong></h2><p>Valid for 10 minutes.</p>`;
    try {
        await sendEmail(email, `🔐 Your OTP for ${purpose}`, html);
    } catch (error) {
        console.error('sendOTP failed:', error.message);
    }
};

const sendNewReviewAlert = async (review) => {
    const subject = `⭐ New Review Submitted by ${review.customerName}`;
    const html = `
        <h2>New Review Submitted</h2>
        <p><strong>Customer:</strong> ${review.customerName}</p>
        <p><strong>Rating:</strong> ${review.rating} / 5</p>
        <p><strong>Comment:</strong><br/>${review.comment}</p>
    `;
    try {
        await sendEmail(getCompanyEmail(), subject, html);
        console.log(`New review alert sent for ${review.customerName}`);
    } catch (error) {
        console.error('sendNewReviewAlert failed:', error.message);
    }
};

const sendEmailChangeVerification = async (newEmail, otp) => {
    const html = `<h2>Verification OTP: ${otp}</h2>`;
    try {
        await sendEmail(newEmail, 'Verify your new email address', html);
    } catch (error) {
        console.error('sendEmailChangeVerification failed:', error.message);
    }
};

const sendContactReply = async (contact) => {
    const biz = await getBusinessInfo();
    const html = `<h2>Our response</h2><p>${contact.reply}</p>`;
    try {
        await sendEmail(contact.email, `Reply from ${biz.businessName}`, html);
    } catch (error) {
        console.error('sendContactReply failed:', error.message);
    }
};

const sendSuperAdminNotification = async (subject, messageHtml) => {
    const adminEmail = await getAdminEmail();
    try {
        await sendEmail(adminEmail, `🛡️ ${subject}`, `<h2>${subject}</h2>${messageHtml}`);
        console.log(`Super admin notification sent to ${adminEmail}`);
    } catch (error) {
        console.error('sendSuperAdminNotification failed:', error.message);
    }
};

const sendPromotionReminder = async (booking) => {
    const html = `<p>Your FREE Wheel Service is scheduled for today at ${booking.time}.</p>`;
    try {
        await sendEmail(booking.customerEmail, 'Reminder: Your FREE Wheel Service is today!', html);
    } catch (error) {
        console.error('sendPromotionReminder failed:', error.message);
    }
};

// ========== EXPORT EVERYTHING ==========
module.exports = {
    startScheduler,
    sendSaturdayPromotionToAll,
    sendResetEmail,
    sendBookingStatusEmail,
    sendReviewStatusEmail,
    sendContactAutoReply,
    sendPromotionBookingEmail,
    sendWelcomeEmail,
    getAdminEmail,
    sendEmail,
    sendNewReviewAlert, 
    sendContactAlert,
    sendSuperAdminNotification,
    sendCustomerBookingConfirmation,
    sendBookingAlert,
    sendBookingStatusUpdate,
    sendReviewStatusUpdate,
    sendOTP,
    sendEmailChangeVerification,
    sendContactReply,
    sendPromotionReminder,
    getBusinessInfo,
    _invalidateCache,
};