const mongoose = require('mongoose');

const userWalletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, enum: ['usdt_trc20', 'bitcoin', 'ethereum', 'paypal', 'other'], default: 'other' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

userWalletSchema.index({ userId: 1 });

module.exports = mongoose.model('UserWallet', userWalletSchema);
