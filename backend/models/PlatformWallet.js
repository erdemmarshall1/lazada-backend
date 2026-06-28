const mongoose = require('mongoose');

const platformWalletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  escrowBalance: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PlatformWallet', platformWalletSchema);
