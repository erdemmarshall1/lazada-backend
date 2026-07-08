const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  exchangeRate: { type: Number, required: true, default: 1 },
  isDefault: { type: Boolean, default: false },
  status: { type: Number, enum: [0, 1], default: 1 },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Currency', currencySchema);
