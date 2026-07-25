const mongoose = require('mongoose');

const taxRateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rate: { type: Number, required: true, min: 0, max: 100 },
  type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  region: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  status: { type: Number, enum: [0, 1], default: 1 },
  translations: {
    name: { type: Map, of: String, default: {} },
    region: { type: Map, of: String, default: {} },
  },
}, { timestamps: true });

module.exports = mongoose.model('TaxRate', taxRateSchema);
