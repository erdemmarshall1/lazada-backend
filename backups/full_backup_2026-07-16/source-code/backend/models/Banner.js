const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  image: { type: String, required: true },
  link: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  position: { type: String, enum: ['home', 'category'], default: 'home' },
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

bannerSchema.index({ position: 1, sort: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
