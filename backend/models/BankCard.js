const mongoose = require('mongoose');

const bankCardSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bankName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  cardHolder: { type: String, required: true },
  phone: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

bankCardSchema.index({ userId: 1 });

module.exports = mongoose.model('BankCard', bankCardSchema);
