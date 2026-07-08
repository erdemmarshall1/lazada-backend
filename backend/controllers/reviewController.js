const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { success, fail, paginate } = require('../utils/response');

const SPAM_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /(buy|click|visit|check|cheap|discount|promo)\s*(now|here|this|link)/gi,
  /(free|win|prize|cash|bonus|guaranteed?)/gi,
  /(<a\s[^>]*>)/gi,
  /(www\.)[a-z]/gi,
  /[A-Z\s]{20,}/g,
];

const detectSpam = (content) => {
  if (!content) return false;
  let score = 0;
  for (const pattern of SPAM_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) score += matches.length;
  }
  return score >= 3;
};

exports.add = async (req, res) => {
  try {
    const { productId, orderId, skuId, rating, content, images } = req.body;
    if (!productId || !orderId || !rating) return res.json(fail('Missing required fields'));
    const existing = await Review.findOne({ userId: req.user._id, productId, orderId });
    if (existing) return res.json(fail('Already reviewed'));
    const isSpam = detectSpam(content || '');
    const status = isSpam ? 'spam' : 'approved';
    const review = await Review.create({
      userId: req.user._id, productId, orderId, skuId, rating, content, images, status,
    });
    const order = await Order.findById(orderId);
    if (order) {
      const item = order.items.find(i => i.productId.toString() === productId);
      if (item) item.isReviewed = true;
      await order.save();
    }
    if (status === 'approved') {
      const stats = await Review.aggregate([
        { $match: { productId: review.productId, status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
          rating: Math.round(stats[0].avg * 10) / 10,
          reviewCount: stats[0].count,
        });
      }
    }
    const msg = isSpam ? 'Review flagged for moderation' : 'Review submitted';
    res.json(success(review, msg));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.list = async (req, res) => {
  try {
    const { page: p, pageSize: ps, productId, userId, status } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const filter = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    const [list, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'username avatar')
        .populate('productId', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Review.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('userId', 'username email avatar')
      .populate('productId', 'name images')
      .populate('orderId', 'orderNo');
    if (!review) return res.json(fail('Review not found'));
    res.json(success(review));
  } catch (error) { res.json(fail(error.message)); }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const filter = { productId: req.params.productId, status: 'approved' };
    const [list, total] = await Promise.all([
      Review.find(filter)
        .populate('userId', 'username avatar')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Review.countDocuments(filter),
    ]);
    const stats = await Review.aggregate([
      { $match: { productId: req.params.productId, status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats.forEach(s => { distribution[s._id] = s.count; });
    const totalReviews = stats.reduce((sum, s) => sum + s.count, 0);
    const avgRating = totalReviews > 0
      ? Math.round(stats.reduce((sum, s) => sum + s._id * s.count, 0) / totalReviews * 10) / 10
      : 0;
    res.json(success({ list, total, page, pageSize, stats: { average: avgRating, total: totalReviews, distribution } }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.update = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.json(fail('Review not found'));
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(fail('Not authorized'));
    }
    const updates = {};
    if (req.body.rating) updates.rating = req.body.rating;
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.images !== undefined) updates.images = req.body.images;
    const updated = await Review.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(success(updated, 'Review updated'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.delete = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.json(fail('Review not found'));
    if (review.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.json(fail('Not authorized'));
    }
    await Review.findByIdAndDelete(req.params.id);
    const stats = await Review.aggregate([
      { $match: { productId: review.productId, status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await Product.findByIdAndUpdate(review.productId, {
        rating: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      });
    } else {
      await Product.findByIdAndUpdate(review.productId, { rating: 5, reviewCount: 0 });
    }
    res.json(success(null, 'Review deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.moderate = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected', 'spam'].includes(status)) {
      return res.json(fail('Invalid status'));
    }
    const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!review) return res.json(fail('Review not found'));
    if (status === 'approved') {
      const stats = await Review.aggregate([
        { $match: { productId: review.productId, status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (stats.length > 0) {
        await Product.findByIdAndUpdate(review.productId, {
          rating: Math.round(stats[0].avg * 10) / 10,
          reviewCount: stats[0].count,
        });
      }
    }
    res.json(success(review, `Review ${status}`));
  } catch (error) { res.json(fail(error.message)); }
};

exports.reply = async (req, res) => {
  try {
    const { reply } = req.body;
    if (!reply) return res.json(fail('Reply required'));
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reply, replyTime: new Date() },
      { new: true }
    );
    if (!review) return res.json(fail('Review not found'));
    res.json(success(review, 'Reply added'));
  } catch (error) { res.json(fail(error.message)); }
};