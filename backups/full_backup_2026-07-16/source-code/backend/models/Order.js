const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  skuId: { type: mongoose.Schema.Types.ObjectId, required: true },
  productName: { type: String, required: true },
  productImage: { type: String, default: '' },
  skuAttrs: [{ name: String, value: String }],
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
  isReviewed: { type: Boolean, default: false },
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponCode: { type: String, default: '' },
  finalAmount: { type: Number, required: true },
  status: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6], default: 0 },
  shippingAddress: {
    name: String,
    phone: String,
    province: String,
    city: String,
    district: String,
    detail: String,
  },
  paymentMethod: { type: String, default: '' },
  paymentTime: { type: Date },
  shippingTime: { type: Date },
  confirmTime: { type: Date },
  trackingNo: { type: String, default: '' },
  buyerMessage: { type: String, default: '' },
  sellerMessage: { type: String, default: '' },
  refundStatus: { type: Number, enum: [0, 1, 2, 3], default: 0 },
  refundReason: { type: String, default: '' },
  refundAmount: { type: Number, default: 0 },
}, { timestamps: true });

orderSchema.index({ orderNo: 1 });
orderSchema.index({ userId: 1 });
orderSchema.index({ shopId: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
