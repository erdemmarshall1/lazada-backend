const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: '' },
  category: { type: String, default: '' },
  status: { type: Number, enum: [0, 1], default: 1 },
  sort: { type: Number, default: 0 },
}, { timestamps: true });

faqSchema.index({ status: 1, sort: 1, category: 1 });

module.exports = mongoose.model('Faq', faqSchema);