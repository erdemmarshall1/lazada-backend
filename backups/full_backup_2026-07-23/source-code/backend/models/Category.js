const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  level: { type: Number, default: 1 },
  icon: { type: String, default: '' },
  image: { type: String, default: '' },
  sort: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

categorySchema.index({ parentId: 1 });
categorySchema.index({ level: 1 });

module.exports = mongoose.model('Category', categorySchema);
