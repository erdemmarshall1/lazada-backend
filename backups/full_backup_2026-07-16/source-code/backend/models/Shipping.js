const mongoose = require('mongoose');

const trackingEventSchema = new mongoose.Schema({
  status: { type: Number, required: true },
  location: { type: String, default: '' },
  description: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const shippingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  carrier: { type: String, default: '' },
  trackingNo: { type: String, default: '' },
  status: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6], default: 0 },
  statusHistory: [trackingEventSchema],
  estimatedDelivery: { type: Date },
  deliveredAt: { type: Date },
  senderName: { type: String, default: '' },
  senderPhone: { type: String, default: '' },
  senderAddress: { type: String, default: '' },
  receiverName: { type: String, default: '' },
  receiverPhone: { type: String, default: '' },
  receiverAddress: { type: String, default: '' },
  packageWeight: { type: Number, default: 0 },
  packageLength: { type: Number, default: 0 },
  packageWidth: { type: Number, default: 0 },
  packageHeight: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

shippingSchema.index({ orderId: 1 });
shippingSchema.index({ shopId: 1 });
shippingSchema.index({ trackingNo: 1 });
shippingSchema.index({ status: 1 });

module.exports = mongoose.model('Shipping', shippingSchema);
