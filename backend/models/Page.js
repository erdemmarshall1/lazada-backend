const mongoose = require('mongoose');

const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  image: { type: String, default: '' },
  status: { type: Number, enum: [0, 1], default: 1 },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  translations: {
    title: { type: Map, of: String, default: {} },
    content: { type: Map, of: String, default: {} },
    summary: { type: Map, of: String, default: {} },
    metaTitle: { type: Map, of: String, default: {} },
    metaDescription: { type: Map, of: String, default: {} },
  },
}, { timestamps: true });

pageSchema.index({ slug: 1 });
pageSchema.index({ status: 1, sort: -1 });

module.exports = mongoose.model('Page', pageSchema);