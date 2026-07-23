const mongoose = require('mongoose');

const paymentSettingSchema = new mongoose.Schema({
  method: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  walletAddress: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PaymentSetting', paymentSettingSchema);
