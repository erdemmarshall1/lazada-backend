const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  province: { type: String, required: true },
  city: { type: String, required: true },
  district: { type: String, default: '' },
  detail: { type: String, required: true },
  zipCode: { type: String, default: '' },
  isDefault: { type: Boolean, default: false },
  label: { type: String, default: '' },
}, { timestamps: true });

addressSchema.index({ userId: 1 });

module.exports = mongoose.model('Address', addressSchema);
