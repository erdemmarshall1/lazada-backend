const mongoose = require('mongoose');

const platformTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  balanceBefore: { type: Number, default: 0 },
  balanceAfter: { type: Number, default: 0 },
  escrowBefore: { type: Number, default: 0 },
  escrowAfter: { type: Number, default: 0 },
  description: { type: String, default: '' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('PlatformTransaction', platformTransactionSchema);
