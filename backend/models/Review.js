const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  skuId: { type: mongoose.Schema.Types.ObjectId },
  rating: { type: Number, required: true, min: 1, max: 5 },
  content: { type: String, default: '' },
  images: [{ type: String }],
  reply: { type: String, default: '' },
  replyTime: { type: Date },
}, { timestamps: true });

reviewSchema.index({ productId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ orderId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
