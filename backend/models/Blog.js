const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  content: { type: String, default: '' },
  summary: { type: String, default: '' },
  image: { type: String, default: '' },
  category: { type: String, default: '' },
  tags: [{ type: String }],
  author: { type: String, default: '' },
  status: { type: Number, enum: [0, 1], default: 1 },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

blogSchema.index({ slug: 1 });
blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1 });

module.exports = mongoose.model('Blog', blogSchema);