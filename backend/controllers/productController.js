const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const { success, fail, paginate } = require('../utils/response');

exports.getInfo = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id).populate('shopId', 'name logo rating');
    if (!product) return res.json(fail('Product not found'));
    product.salesCount += 1;
    await product.save();
    res.json(success(product));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getSearchList = async (req, res) => {
  try {
    const { keyword, categoryId, sort, order, isRecommended, minPrice, maxPrice, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { status: 1 };
    if (isRecommended === 'true') {
      query.isRecommended = true;
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (categoryId) {
      const cat = await Category.findById(categoryId);
      if (cat) {
        const subCats = await Category.find({ parentId: categoryId }).select('_id');
        const catIds = [categoryId, ...subCats.map(c => c._id)];
        query.categoryId = { $in: catIds };
      }
    }
    if (minPrice || maxPrice) {
      query.minPrice = {};
      if (minPrice) query.minPrice.$gte = Number(minPrice);
      if (maxPrice) query.minPrice.$lte = Number(maxPrice);
    }
    let sortObj = { createdAt: -1 };
    if (sort === 'price') sortObj = { minPrice: order === 'asc' ? 1 : -1 };
    else if (sort === 'sales') sortObj = { salesCount: -1 };
    else if (sort === 'rating') sortObj = { rating: -1 };
    else if (sort === 'new') sortObj = { createdAt: -1 };

    const [list, total] = await Promise.all([
      Product.find(query).sort(sortObj).skip(skip).limit(limit).populate('shopId', 'name'),
      Product.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getRandList = async (req, res) => {
  try {
    const count = await Product.countDocuments({ status: 1 });
    const random = Math.max(1, Math.floor(Math.random() * count));
    const list = await Product.find({ status: 1 }).skip(random).limit(20).populate('shopId', 'name');
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getData = async (req, res) => {
  try {
    const { ids } = req.query;
    if (!ids) return res.json(fail('Ids required'));
    const idArr = ids.split(',');
    const products = await Product.find({ _id: { $in: idArr } });
    res.json(success(products));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getHotList = async (req, res) => {
  try {
    const list = await Product.find({ status: 1, isHot: true })
      .sort({ salesCount: -1 }).limit(20).populate('shopId', 'name');
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getReviewsList = async (req, res) => {
  try {
    const { productId, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = productId ? { productId } : {};
    const [list, total] = await Promise.all([
      Review.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'username avatar'),
      Review.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getCategoryList = async (req, res) => {
  try {
    const list = await Category.find({ status: 1 }).sort({ sort: 1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getSkuInfo = async (req, res) => {
  try {
    const product = await Product.findById(req.query.productId);
    if (!product) return res.json(fail('Product not found'));
    const sku = product.skus.id(req.query.skuId);
    if (!sku) return res.json(fail('SKU not found'));
    res.json(success(sku));
  } catch (error) {
    res.json(fail(error.message));
  }
};
