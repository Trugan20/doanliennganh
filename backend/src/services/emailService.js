'use strict';

const logger = require('../utils/logger');

/**
 * Email Service for VinaMec Dental Care System.
 *
 * In production, replace the `send` implementation with Nodemailer + SMTP,
 * SendGrid, AWS SES, or any provider by setting the env vars below:
 *
 *   EMAIL_PROVIDER=sendgrid | smtp | ses
 *   EMAIL_FROM=noreply@vinamec.vn
 *   SENDGRID_API_KEY=SG.xxx
 *   SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS
 */

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@vinamec.vn';
const FROM_NAME    = 'VinaMec Dental Care';

/**
 * Core send function.
 * Replace body with real transport (Nodemailer, SendGrid SDK, etc.)
 */
const send = async ({ to, subject, html, text }) => {
  // --- PRODUCTION: uncomment and configure one of these ---
  //
  // Option A: Nodemailer SMTP
  // const transporter = nodemailer.createTransport({ host, port, auth: { user, pass } });
  // await transporter.sendMail({ from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to, subject, html, text });
  //
  // Option B: SendGrid
  // await sgMail.send({ from: `"${FROM_NAME}" <${FROM_ADDRESS}>`, to, subject, html });
  //
  // ---------------------------------------------------------

  // DEV: log to console instead of sending
  logger.info(`📧 [EMAIL] To: ${to} | Subject: ${subject}`);
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Email body preview:', { text: text?.slice(0, 200) });
  }
  return { success: true, to, subject };
};

// ─── Templates ───────────────────────────────────────────────────────────────

const appointmentConfirmationEmail = async ({ to, patientName, doctorName, date, time, service }) => {
  const subject = `✅ Appointment Confirmed – ${date} at ${time}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:linear-gradient(135deg,#0ea5e9,#14b8a6);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;font-size:22px;">🦷 VinaMec Dental Care</h1>
      </div>
      <div style="padding:24px;background:#f8fafc;border-radius:0 0 12px 12px;">
        <h2 style="color:#0f172a;">Appointment Confirmed</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been confirmed. Here are the details:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;color:#64748b;">Doctor</td><td style="padding:8px;font-weight:600;">Dr. ${doctorName}</td></tr>
          <tr style="background:#fff;"><td style="padding:8px;color:#64748b;">Service</td><td style="padding:8px;font-weight:600;">${service}</td></tr>
          <tr><td style="padding:8px;color:#64748b;">Date</td><td style="padding:8px;font-weight:600;">${date}</td></tr>
          <tr style="background:#fff;"><td style="padding:8px;color:#64748b;">Time</td><td style="padding:8px;font-weight:600;">${time}</td></tr>
        </table>
        <p style="color:#64748b;font-size:14px;">Please arrive 10 minutes early. If you need to reschedule, log in to your VinaMec portal.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/patient/appointments"
           style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px;">
          View Appointment
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px;">VinaMec Dental Care – Your smile, our mission.</p>
      </div>
    </div>
  `;
  const text = `Appointment confirmed for ${patientName}. Doctor: ${doctorName}. Date: ${date} at ${time}. Service: ${service}.`;
  return send({ to, subject, html, text });
};

const appointmentCancellationEmail = async ({ to, patientName, date, time, reason }) => {
  const subject = `❌ Appointment Cancelled – ${date} at ${time}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2 style="color:#ef4444;">Appointment Cancelled</h2>
      <p>Dear <strong>${patientName}</strong>,</p>
      <p>Your appointment on <strong>${date}</strong> at <strong>${time}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please book a new appointment at your convenience through the VinaMec portal.</p>
    </div>
  `;
  const text = `Your appointment on ${date} at ${time} has been cancelled. ${reason ? 'Reason: ' + reason : ''}`;
  return send({ to, subject, html, text });
};

const appointmentReminderEmail = async ({ to, patientName, doctorName, date, time }) => {
  const subject = `⏰ Reminder: Appointment Tomorrow at ${time}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2>Appointment Reminder</h2>
      <p>Hi <strong>${patientName}</strong>,</p>
      <p>Just a reminder that you have an appointment with <strong>Dr. ${doctorName}</strong> tomorrow on <strong>${date}</strong> at <strong>${time}</strong>.</p>
      <p>Remember to bring your insurance card if applicable. See you soon!</p>
    </div>
  `;
  const text = `Reminder: appointment with Dr. ${doctorName} on ${date} at ${time}.`;
  return send({ to, subject, html, text });
};

const welcomeEmail = async ({ to, name, role }) => {
  const subject = '🦷 Welcome to VinaMec Dental Care!';
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <div style="background:linear-gradient(135deg,#0ea5e9,#14b8a6);padding:24px;border-radius:12px 12px 0 0;">
        <h1 style="color:#fff;margin:0;">Welcome to VinaMec!</h1>
      </div>
      <div style="padding:24px;background:#f8fafc;border-radius:0 0 12px 12px;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your <strong>${role}</strong> account has been created. You can now log in and start using the platform.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Login Now
        </a>
      </div>
    </div>
  `;
  const text = `Welcome to VinaMec, ${name}! Your ${role} account is ready.`;
  return send({ to, subject, html, text });
};

const passwordChangedEmail = async ({ to, name }) => {
  const subject = '🔐 Your Password Was Changed';
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2>Password Changed</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your VinaMec account password was recently changed. If this was not you, please contact support immediately.</p>
      <p style="color:#64748b;font-size:14px;">Time: ${new Date().toLocaleString()}</p>
    </div>
  `;
  const text = `Your VinaMec password was changed at ${new Date().toLocaleString()}. Contact support if this was not you.`;
  return send({ to, subject, html, text });
};

const medicalRecordCreatedEmail = async ({ to, patientName, diagnosis, doctorName, date }) => {
  const subject = `📋 New Medical Record – ${date}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;">
      <h2>New Medical Record Added</h2>
      <p>Dear <strong>${patientName}</strong>,</p>
      <p>A new medical record has been added to your profile by <strong>Dr. ${doctorName}</strong> on <strong>${date}</strong>.</p>
      <p><strong>Diagnosis:</strong> ${diagnosis}</p>
      <p>Log in to view your full record and any prescriptions.</p>
    </div>
  `;
  const text = `New medical record by Dr. ${doctorName} on ${date}. Diagnosis: ${diagnosis}.`;
  return send({ to, subject, html, text });
};

module.exports = {
  send,
  welcomeEmail,
  appointmentConfirmationEmail,
  appointmentCancellationEmail,
  appointmentReminderEmail,
  passwordChangedEmail,
  medicalRecordCreatedEmail,
};