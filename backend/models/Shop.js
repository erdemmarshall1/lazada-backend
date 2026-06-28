const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true },
  logo: { type: String, default: '' },
  banner: { type: String, default: '' },
  description: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  fullName: { type: String, default: '' },
  email: { type: String, default: '' },
  idFrontImage: { type: String, default: '' },
  idBackImage: { type: String, default: '' },
  utilityBill: { type: String, default: '' },
  idNumber: { type: String, default: '' },
  invitationCode: { type: String, default: '' },
  status: { type: Number, enum: [0, 1, 2], default: 0 },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  salesCount: { type: Number, default: 0 },
  productCount: { type: Number, default: 0 },
  followerCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
