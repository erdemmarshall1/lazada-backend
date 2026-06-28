const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['recharge', 'withdraw', 'payment', 'refund', 'admin', 'distribution', 'wholesale_purchase', 'payout'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1, 2], default: 1 },
  description: { type: String, default: '' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  paymentMethod: { type: String, default: '' },
  receipt: { type: String, default: '' },
}, { timestamps: true });

transactionSchema.index({ userId: 1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
