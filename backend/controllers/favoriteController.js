const Favorite = require('../models/Favorite');
const BrowseHistory = require('../models/BrowseHistory');
const Shop = require('../models/Shop');
const { success, fail, paginate } = require('../utils/response');

exports.shop = async (req, res) => {
  try {
    const { shopId } = req.body;
    const existing = await Favorite.findOne({ userId: req.user._id, targetId: shopId, type: 'shop' });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      await Shop.findByIdAndUpdate(shopId, { $inc: { followerCount: -1 } });
      res.json(success({ followed: false }, 'Shop unfollowed'));
    } else {
      await Favorite.create({ userId: req.user._id, targetId: shopId, type: 'shop' });
      await Shop.findByIdAndUpdate(shopId, { $inc: { followerCount: 1 } });
      res.json(success({ followed: true }, 'Shop followed'));
    }
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.product = async (req, res) => {
  try {
    const { productId } = req.body;
    const existing = await Favorite.findOne({ userId: req.user._id, targetId: productId, type: 'product' });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      res.json(success({ favorited: false }, 'Removed from wishlist'));
    } else {
      await Favorite.create({ userId: req.user._id, targetId: productId, type: 'product' });
      res.json(success({ favorited: true }, 'Added to wishlist'));
    }
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.check = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({ userId: req.user._id, targetId: req.params.productId, type: 'product' });
    res.json(success({ favorited: !!favorite }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getProductList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      Favorite.find({ userId: req.user._id, type: 'product' })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).populate('targetId'),
      Favorite.countDocuments({ userId: req.user._id, type: 'product' }),
    ]);
    const products = list.map(f => f.targetId).filter(Boolean);
    res.json(success({ list: products, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getBrowseList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      BrowseHistory.find({ userId: req.user._id })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).populate('productId'),
      BrowseHistory.countDocuments({ userId: req.user._id }),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getShopList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      Favorite.find({ userId: req.user._id, type: 'shop' })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).populate('targetId'),
      Favorite.countDocuments({ userId: req.user._id, type: 'shop' }),
    ]);
    const shops = list.map(f => f.targetId).filter(Boolean);
    res.json(success({ list: shops, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};
