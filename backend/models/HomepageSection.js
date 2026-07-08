const mongoose = require('mongoose');

const homepageSectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['banner', 'product_grid', 'category_grid', 'featured', 'promo_bar', 'custom_html'],
    required: true,
  },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1], default: 1 },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

homepageSectionSchema.index({ status: 1, sort: 1 });

module.exports = mongoose.model('HomepageSection', homepageSectionSchema);
