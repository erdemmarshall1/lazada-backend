const mongoose = require('mongoose');

const skuSchema = new mongoose.Schema({
  attrs: [{ name: String, value: String }],
  price: { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  image: { type: String, default: '' },
  weight: { type: Number, default: 0 },
  cost: { type: Number, default: 0 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  images: [{ type: String }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  skus: [skuSchema],
  minPrice: { type: Number, default: 0 },
  maxPrice: { type: Number, default: 0 },
  originalPrice: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  rating: { type: Number, default: 5, min: 0, max: 5 },
  tags: [{ type: String }],
  status: { type: Number, enum: [0, 1, 2], default: 1 },
  isHot: { type: Boolean, default: false },
  isRecommended: { type: Boolean, default: false },
  isFlashSale: { type: Boolean, default: false },
  flashSalePrice: { type: Number, default: 0 },
  flashSaleStart: { type: Date },
  flashSaleEnd: { type: Date },
  flashSaleStock: { type: Number, default: 0 },
  profitPercentage: { type: Number, default: 20, min: 0, max: 1000 },
  originalId: { type: String, default: '' },
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ categoryId: 1 });
productSchema.index({ shopId: 1 });
productSchema.index({ isHot: 1, isRecommended: 1 });
productSchema.index({ minPrice: 1, maxPrice: 1 });
productSchema.index({ originalId: 1 });

productSchema.pre('save', function (next) {
  if (this.skus && this.skus.length > 0) {
    const prices = this.skus.map(s => s.price);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    const origPrices = this.skus.map(s => s.originalPrice || 0).filter(p => p > 0);
    this.originalPrice = origPrices.length > 0 ? Math.max(...origPrices) : this.maxPrice;
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
