const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalRecharge: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
