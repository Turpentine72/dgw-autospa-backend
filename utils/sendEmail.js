const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const { decrypt } = require('./cryptoUtils');

// Cache management
let cachedTransporter = null;
let lastSettings = null;

exports._invalidateCache = () => {
  lastSettings = null;
};

const getTransporter = async () => {
  try {
    const settings = await Settings.findOne();
    const current = settings ? settings : {};
    if (cachedTransporter && JSON.stringify(current) === lastSettings) {
      return cachedTransporter;
    }
    const user = current.mailUser || process.env.EMAIL_USER;
    const pass = current.mailPassEncrypted
      ? decrypt(current.mailPassEncrypted)
      : process.env.EMAIL_PASS;
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
    lastSettings = JSON.stringify(current);
    return cachedTransporter;
  } catch (err) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }
};

const safeSend = async (options) => {
  try {
    const transporter = await getTransporter();
    await transporter.sendMail({
      from: `"DGW Autospa" <${(await Settings.findOne())?.mailUser || process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
    console.log(`✅ Email sent to ${options.email} – ${options.subject}`);
  } catch (err) {
    console.error(`❌ Email to ${options.email} failed:`, err.message);
  }
};

// ---------- Dynamic brand wrapper ----------
const wrapTemplate = (body, business) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DGW Autospa</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:20px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.08);">
    <tr>
      <td style="background:linear-gradient(135deg,#0f2b5c,#1d4ed8);padding:28px 24px;text-align:center;">
        <div style="display:inline-block;width:60px;height:60px;background-color:#ffffff;border-radius:50%;line-height:60px;font-size:32px;">🚗</div>
        <h1 style="color:#ffffff;margin:12px 0 0;font-size:28px;font-weight:800;">DGW AUTOSPA</h1>
        <p style="color:#bfdbfe;margin:6px 0 0;font-size:14px;">Premium Automotive Care</p>
      </td>
    </tr>
    <tr>
      <td style="padding:32px 28px;color:#1f2937;">
        ${body}
      </td>
    </tr>
    <tr>
      <td style="background-color:#f8fafc;padding:20px 28px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="font-size:13px;color:#6b7280;margin:0 0 12px;">Need help? Contact us instantly:</p>
        <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
          <tr>
            <td style="padding:0 6px;">
              <a href="https://wa.me/${business.phone.replace(/\s/g, '')}" style="display:inline-block;background-color:#25D366;color:#ffffff;padding:10px 18px;border-radius:30px;text-decoration:none;font-size:13px;">💬 WhatsApp</a>
            </td>
            <td style="padding:0 6px;">
              <a href="tel:${business.phone.replace(/\s/g, '')}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;padding:10px 18px;border-radius:30px;text-decoration:none;font-size:13px;">📞 ${business.phone}</a>
            </td>
            <td style="padding:0 6px;">
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=${business.email}" style="display:inline-block;background-color:#374151;color:#ffffff;padding:10px 18px;border-radius:30px;text-decoration:none;font-size:13px;">✉️ Email Us</a>
            </td>
          </tr>
        </table>
        <p style="font-size:12px;color:#9ca3af;margin:8px 0 0;">${business.address}</p>
        <p style="font-size:12px;color:#9ca3af;margin:4px 0 0;">© ${new Date().getFullYear()} DGW Autospa. All rights reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getBusinessSettings = async () => {
  try {
    const settings = await Settings.findOne();
    const business = settings?.business || {};
    return {
      phone: business.phone || '+234 702 588 7213',
      email: business.email || process.env.EMAIL_USER,
      address: business.address || '4, Ibrahim Odofin Street, Idado Estate, Lekki Peninsula II, Lagos, Nigeria',
    };
  } catch (err) {
    return {
      phone: '+234 702 588 7213',
      email: process.env.EMAIL_USER,
      address: '4, Ibrahim Odofin Street, Idado Estate, Lekki Peninsula II, Lagos, Nigeria',
    };
  }
};

const renderTemplate = async (body) => {
  const business = await getBusinessSettings();
  return wrapTemplate(body, business);
};

// ---------- UPGRADED CUSTOMER BOOKING CONFIRMATION ----------
exports.sendCustomerBookingConfirmation = async (booking) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;font-size:22px;margin-top:0;">🎉 Congratulations, ${booking.customerName}!</h2>
    <p style="font-size:15px;">Your booking request has been received and is being processed. Our team will contact you shortly with pricing and to confirm your preferred date and time.</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;"><strong>Service:</strong> ${booking.serviceName}</p>
      <p style="margin:0 0 8px;"><strong>Preferred Date:</strong> ${new Date(booking.date).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      <p style="margin:0 0 8px;"><strong>Preferred Time:</strong> ${booking.time}</p>
      <p style="margin:0;"><strong>Status:</strong> <span style="color:#f59e0b;font-weight:bold;">PENDING</span></p>
    </div>
    <p style="font-size:14px;color:#4b5563;">If you have any questions, feel free to reply to this email or call us at the number below.</p>
  `);
  await safeSend({
    email: booking.customerEmail,
    subject: `🎉 Booking Received – ${booking.serviceName}`,
    html,
  });
};

// ---------- UPGRADED BOOKING ALERT TO COMPANY ----------
exports.sendBookingAlert = async (booking) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">🚗 New Booking Alert</h2>
    <p>A new booking has been submitted. Details below:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:14px;">
      <p><strong>Customer:</strong> ${booking.customerName}</p>
      <p><strong>Email:</strong> ${booking.customerEmail}</p>
      <p><strong>Phone:</strong> ${booking.customerPhone || 'N/A'}</p>
      <p><strong>Service:</strong> ${booking.serviceName}</p>
      <p><strong>Date & Time:</strong> ${booking.date} at ${booking.time}</p>
      ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    </div>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">Log in to the admin panel to manage this booking.</p>
  `);
  await safeSend({
    email: process.env.COMPANY_EMAIL,
    subject: `🚗 New Booking: ${booking.serviceName}`,
    html,
  });
};

// ---------- UPGRADED BOOKING STATUS UPDATE ----------
exports.sendBookingStatusUpdate = async (booking) => {
  let emoji = '📅';
  let heading = 'Booking Update';
  let message = `Your booking for <strong>${booking.serviceName}</strong> has been updated.`;

  if (booking.status === 'contacted') {
    emoji = '📞';
    heading = 'We’ve Reached Out!';
    message = `We've contacted you regarding your booking for <strong>${booking.serviceName}</strong>. Please check your phone or email for details.`;
  } else if (booking.status === 'confirmed') {
    emoji = '🎉';
    heading = 'Booking Confirmed!';
    message = `Great news! Your appointment for <strong>${booking.serviceName}</strong> on <strong>${booking.date}</strong> at <strong>${booking.time}</strong> has been confirmed.`;
  } else if (booking.status === 'completed') {
    emoji = '🏁';
    heading = 'Service Completed';
    message = `Your service <strong>${booking.serviceName}</strong> has been completed. Thank you for choosing DGW Autospa!`;
  } else if (booking.status === 'cancelled') {
    emoji = '❌';
    heading = 'Booking Cancelled';
    message = `Your booking for <strong>${booking.serviceName}</strong> has been cancelled. If this was a mistake, please reach out to us.`;
  }

  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;">${emoji} ${heading}</h2>
    <p style="font-size:15px;">${message}</p>
    ${booking.adminNotes ? `<p style="font-size:14px;color:#4b5563;"><strong>Note from us:</strong> ${booking.adminNotes}</p>` : ''}
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">If you have any questions, please call us or use the contact buttons below.</p>
  `);
  await safeSend({
    email: booking.customerEmail,
    subject: `${emoji} ${heading} – ${booking.serviceName}`,
    html,
  });
};

// ---------- UPGRADED NEW REVIEW ALERT ----------
exports.sendNewReviewAlert = async (review) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;">⭐ New Review Received</h2>
    <p>A customer just left a review:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:14px;">
      <p><strong>Customer:</strong> ${review.customerName}</p>
      <p><strong>Rating:</strong> ${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)}</p>
      <p><strong>Comment:</strong> ${review.comment}</p>
      ${review.service ? `<p><strong>Service:</strong> ${review.service}</p>` : ''}
    </div>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">Approve or reply to this review in the admin panel.</p>
  `);
  await safeSend({
    email: process.env.COMPANY_EMAIL,
    subject: `⭐ New Review from ${review.customerName}`,
    html,
  });
};

// ---------- UPGRADED REVIEW STATUS UPDATE ----------
exports.sendReviewStatusUpdate = async (review, status) => {
  let emoji = status === 'approved' ? '✅' : '❌';
  let heading = `Review ${status.charAt(0).toUpperCase() + status.slice(1)}`;
  let message = `Your review for <strong>${review.service || 'our service'}</strong> has been ${status}.`;
  if (status === 'approved') {
    emoji = '🎉';
    heading = 'Your Review is Live!';
    message = `Thank you for your feedback! Your review for <strong>${review.service || 'our service'}</strong> has been approved and is now visible on our website.`;
  } else if (status === 'rejected') {
    emoji = '❌';
    heading = 'Review Not Approved';
    message = `Unfortunately, your review for <strong>${review.service || 'our service'}</strong> did not meet our guidelines and was not approved.`;
  } else if (status === 'updated with a reply') {
    emoji = '💬';
    heading = 'We Replied to Your Review';
    message = `Thank you for your review! Our team has responded to your comments.`;
  }

  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;">${emoji} ${heading}</h2>
    <p style="font-size:15px;">${message}</p>
    ${review.reply ? `<div style="background:#f1f5f9;border-radius:12px;padding:12px;margin-top:12px;"><p style="margin:0;"><strong>Our Reply:</strong> ${review.reply}</p></div>` : ''}
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">If you have any questions, please reach out to us.</p>
  `);
  await safeSend({
    email: review.customerEmail,
    subject: `${emoji} ${heading}`,
    html,
  });
};

// ---------- UPGRADED OTP ----------
exports.sendOTP = async (email, otp, purpose = 'password reset') => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">🔐 OTP for ${purpose}</h2>
    <p style="font-size:15px;">Use the one‑time password below to complete your request:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:15px 0;">
      <span style="font-size:32px;letter-spacing:6px;font-weight:800;color:#0f2b5c;">${otp}</span>
    </div>
    <p style="font-size:13px;color:#6b7280;">This OTP expires in 10 minutes. If you did not request this, please ignore.</p>
  `);
  await safeSend({ email, subject: `🔐 Your ${purpose} OTP`, html });
};

exports.sendEmailChangeVerification = async (newEmail, otp) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">🔒 Verify Your New Email</h2>
    <p style="font-size:15px;">To complete your email change, enter the OTP below:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:15px 0;">
      <span style="font-size:32px;letter-spacing:6px;font-weight:800;color:#0f2b5c;">${otp}</span>
    </div>
    <p style="font-size:13px;color:#6b7280;">This OTP is valid for 10 minutes.</p>
  `);
  await safeSend({ email: newEmail, subject: '🔒 Verify Your New Email Address', html });
};

// ---------- SUPER ADMIN NOTIFICATIONS (unchanged but now uses dynamic footer) ----------
exports.sendSuperAdminNotification = async (subject, html) => {
  const Admin = require('../models/Admin');
  const superAdmin = await Admin.findOne({ role: 'Super Admin' });
  if (superAdmin) {
    const rendered = await renderTemplate(html);
    await safeSend({ email: superAdmin.email, subject, html: rendered });
  }
};

// ---------- UPGRADED PROMOTION REMINDER ----------
exports.sendPromotionReminder = async (booking) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">🎉 Your FREE Wheel Service is Today!</h2>
    <p style="font-size:15px;">Hi ${booking.customerName},</p>
    <p style="font-size:14px;color:#4b5563;">Just a friendly reminder that your <strong style="color:#1d4ed8;">FREE Wheel Service</strong> is scheduled for <strong>today</strong> at ${booking.time}.</p>
    <p style="font-size:14px;color:#4b5563;">We are located at:</p>
    <p style="font-size:14px;color:#4b5563;">📍 4, Ibrahim Odofin Street, Idado Estate, Lekki Peninsula II, Lagos</p>
    <p style="margin-top:20px;font-size:14px;">Drive safely, and we look forward to serving you!</p>
  `);
  await safeSend({
    email: booking.customerEmail,
    subject: `🎉 Reminder – Your FREE Wheel Service is today!`,
    html,
  });
};

// ---------- UPGRADED CONTACT ALERTS ----------
exports.sendContactAlert = async (contact) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">💬 New Contact Message</h2>
    <p>A new message was submitted via the website contact form:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:14px;">
      <p><strong>Name:</strong> ${contact.name}</p>
      <p><strong>Email:</strong> ${contact.email}</p>
      <p><strong>Subject:</strong> ${contact.subject || 'N/A'}</p>
      <p><strong>Service:</strong> ${contact.service || 'N/A'}</p>
      <p><strong>Message:</strong></p>
      <div style="background:#ffffff;border-radius:8px;padding:10px;margin-top:8px;">${contact.message}</div>
    </div>
    <p style="margin-top:16px;font-size:13px;color:#6b7280;">Reply directly from the admin panel – the customer will receive an email.</p>
  `);
  await safeSend({
    email: process.env.COMPANY_EMAIL,
    subject: `💬 New Contact Message from ${contact.name}`,
    html,
  });
};

exports.sendContactReply = async (contact) => {
  const html = await renderTemplate(`
    <h2 style="color:#0f2b5c;margin-top:0;">📩 Message from the DGW Autospa Team</h2>
    <p style="font-size:15px;">Hi ${contact.name},</p>
    <p style="font-size:14px;color:#4b5563;">Thank you for reaching out. Here is our response:</p>
    <div style="background:#f1f5f9;border-radius:12px;padding:14px;margin:15px 0;">${contact.reply}</div>
    <p style="font-size:13px;color:#6b7280;">If you have further questions, please don't hesitate to contact us.</p>
  `);
  await safeSend({
    email: contact.email, 
    subject: `📩 Reply from DGW Autospa`,
    html,
  });
};