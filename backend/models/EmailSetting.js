const mongoose = require('mongoose');

const emailSettingSchema = new mongoose.Schema({
  host: { type: String, default: 'smtp.ethereal.email' },
  port: { type: Number, default: 587 },
  user: { type: String, default: '' },
  pass: { type: String, default: '' },
  fromName: { type: String, default: 'Shopify Wholesale' },
  fromEmail: { type: String, default: 'noreply@shopifywholesale.com' },
  sendOrderConfirmation: { type: Boolean, default: true },
  sendPaymentConfirmation: { type: Boolean, default: true },
  sendShippingUpdate: { type: Boolean, default: true },
  sendRefundNotification: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('EmailSetting', emailSettingSchema);
