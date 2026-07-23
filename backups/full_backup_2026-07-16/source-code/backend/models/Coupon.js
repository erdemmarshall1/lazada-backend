const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 0 },
  maxUses: { type: Number, default: 0 },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date },
  status: { type: Number, enum: [0, 1], default: 1 },
  description: { type: String, default: '' },
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ status: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
