const nodemailer = require('nodemailer');
const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = require('../config/app');
const EmailSetting = require('../models/EmailSetting');

let transporter = null;

const getTransporter = async () => {
  if (transporter) return transporter;
  let host = EMAIL_HOST, port = EMAIL_PORT, user = EMAIL_USER, pass = EMAIL_PASS, from = EMAIL_FROM;
  try {
    const dbSettings = await EmailSetting.findOne();
    if (dbSettings) {
      if (dbSettings.host) host = dbSettings.host;
      if (dbSettings.port) port = dbSettings.port;
      if (dbSettings.user) user = dbSettings.user;
      if (dbSettings.pass) pass = dbSettings.pass;
      if (dbSettings.fromEmail) from = dbSettings.fromEmail;
    }
  } catch {}
  if (host && host !== 'smtp.ethereal.email' && user) {
    transporter = nodemailer.createTransport({
      host, port,
      secure: port === 465,
      auth: { user, pass },
    });
    return transporter;
  }
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email', port: 587,
    secure: false, auth: { user: testAccount.user, pass: testAccount.pass },
  });
  console.log('Email: using Ethereal test account:', testAccount.user);
  return transporter;
};

const clearTransporterCache = () => {
  transporter = null;
};

const getFromAddress = async () => {
  try {
    const dbSettings = await EmailSetting.findOne();
    if (dbSettings?.fromEmail) return dbSettings.fromEmail;
  } catch {}
  return EMAIL_FROM;
};

const shouldSend = async (type) => {
  try {
    const settings = await EmailSetting.findOne();
    if (!settings) return true;
    return settings[type] !== false;
  } catch {
    return true;
  }
};

const sendMail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    const from = await getFromAddress();
    const info = await t.sendMail({ from, to, subject, html });
    if (info.messageId) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) console.log('Email preview:', previewUrl);
    }
    return info;
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.sendOrderConfirmation = async (user, order) => {
  if (!(await shouldSend('sendOrderConfirmation'))) return;
  await sendMail({
    to: user.email,
    subject: `Order Confirmed - ${order.orderNo}`,
    html: `<h2>Order Confirmed</h2>
<p>Dear ${user.username},</p>
<p>Your order <strong>${order.orderNo}</strong> has been placed successfully.</p>
<p>Total: <strong>$${order.finalAmount.toFixed(2)}</strong></p>
<p>Status: Pending Payment</p>
<p>Thank you for shopping with us!</p>`,
  });
};

exports.sendPaymentConfirmation = async (user, order) => {
  if (!(await shouldSend('sendPaymentConfirmation'))) return;
  await sendMail({
    to: user.email,
    subject: `Payment Received - ${order.orderNo}`,
    html: `<h2>Payment Received</h2>
<p>Dear ${user.username},</p>
<p>Your payment for order <strong>${order.orderNo}</strong> has been received.</p>
<p>Amount: <strong>$${order.finalAmount.toFixed(2)}</strong></p>
<p>We will notify you when your order ships.</p>`,
  });
};

exports.sendShippingUpdate = async (user, order) => {
  if (!(await shouldSend('sendShippingUpdate'))) return;
  await sendMail({
    to: user.email,
    subject: `Order Shipped - ${order.orderNo}`,
    html: `<h2>Order Shipped</h2>
<p>Dear ${user.username},</p>
<p>Your order <strong>${order.orderNo}</strong> has been shipped.</p>
${order.trackingNo ? `<p>Tracking: <strong>${order.trackingNo}</strong></p>` : ''}
<p>Please confirm arrival when you receive your package.</p>`,
  });
};

exports.sendRefundNotification = async (user, order) => {
  if (!(await shouldSend('sendRefundNotification'))) return;
  await sendMail({
    to: user.email,
    subject: `Refund Processed - ${order.orderNo}`,
    html: `<h2>Refund Processed</h2>
<p>Dear ${user.username},</p>
<p>Your refund for order <strong>${order.orderNo}</strong> has been processed.</p>
<p>Amount: <strong>$${(order.refundAmount || order.finalAmount).toFixed(2)}</strong></p>
<p>The amount has been returned to your wallet.</p>`,
  });
};

exports.clearTransporterCache = clearTransporterCache;
