const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  image: { type: String, required: true },
  link: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  position: { type: String, enum: ['home', 'category', 'popup'], default: 'home' },
  status: { type: Number, enum: [0, 1], default: 1 },
  // Popup ad settings
  popupDuration: { type: Number, default: 10 },
  popupDelay: { type: Number, default: 0 },
  popupStartAt: { type: Date, default: null },
  popupEndAt: { type: Date, default: null },
  popupDismissible: { type: Boolean, default: true },
  popupFrequency: { type: Number, default: 1 },
  translations: {
    title: { type: Map, of: String, default: {} },
  },
}, { timestamps: true });

bannerSchema.index({ position: 1, sort: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
