const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM_EMAIL } = require('./config');

let transporter = null;

function initEmailService() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('WARNING: SMTP not configured. Email delivery disabled. Set SMTP_HOST, SMTP_USER, SMTP_PASS to enable.');
    return;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function isEmailServiceReady() {
  return transporter !== null;
}

async function sendEmail(to, subject, html) {
  if (!transporter) {
    console.log(`[OFFLINE] Email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: SMTP_FROM_EMAIL,
    to,
    subject,
    html,
    text: html.replace(/<[^>]*>/g, ''), // basic html -> text fallback
  });
}

module.exports = { initEmailService, isEmailServiceReady, sendEmail };
