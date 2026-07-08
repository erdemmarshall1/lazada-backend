const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  carrier: { type: String, default: '' },
  type: { type: String, enum: ['flat', 'weight_based', 'price_based', 'free'], default: 'flat' },
  rate: { type: Number, default: 0 },
  freeShippingThreshold: { type: Number, default: 0 },
  estimatedDays: { type: String, default: '3-7' },
  regions: { type: [String], default: [] },
  status: { type: Number, enum: [0, 1], default: 1 },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
