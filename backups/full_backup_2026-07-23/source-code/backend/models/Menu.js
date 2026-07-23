const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, default: '' },
  target: { type: String, enum: ['_self', '_blank'], default: '_self' },
  children: [{ type: mongoose.Schema.Types.Mixed }],
  sort: { type: Number, default: 0 },
});

const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  key: { type: String, required: true, unique: true, lowercase: true, trim: true },
  items: [menuItemSchema],
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);