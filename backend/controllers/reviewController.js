const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { success, fail } = require('../utils/response');

exports.add = async (req, res) => {
  try {
    const { productId, orderId, skuId, rating, content, images } = req.body;
    if (!productId || !orderId || !rating) return res.json(fail('Missing required fields'));
    const existing = await Review.findOne({ userId: req.user._id, productId, orderId });
    if (existing) return res.json(fail('Already reviewed'));
    const review = await Review.create({
      userId: req.user._id, productId, orderId, skuId, rating, content, images,
    });
    const order = await Order.findById(orderId);
    if (order) {
      const item = order.items.find(i => i.productId.toString() === productId);
      if (item) item.isReviewed = true;
      await order.save();
    }
    const stats = await Review.aggregate([
      { $match: { productId: review.productId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    }
    res.json(success(review, 'Review submitted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
