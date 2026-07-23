const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { success, fail, paginate, rewriteProductImages } = require('../utils/response');

exports.getList = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { shopId: shop._id };
    const [list, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);
    list.forEach(rewriteProductImages);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInfo = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    const product = await Product.findOne({ _id: req.query.id, shopId: shop._id });
    if (!product) return res.json(fail('Product not found'));
    rewriteProductImages(product);
    res.json(success(product));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.add = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    if (shop.status === 3) return res.json(fail('Your store has been closed, kindly contact the customer support'));
    const data = { ...req.body, shopId: shop._id };
    if (data.skus && data.skus.length > 0) {
      const prices = data.skus.map(s => s.price);
      data.minPrice = Math.min(...prices);
      data.maxPrice = Math.max(...prices);
    }
    const product = await Product.create(data);
    await Shop.findByIdAndUpdate(shop._id, { $inc: { productCount: 1 } });
    res.json(success(product, 'Product added'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.edit = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    if (shop.status === 3) return res.json(fail('Your store has been closed, kindly contact the customer support'));
    const { id, ...data } = req.body;
    if (data.skus && data.skus.length > 0) {
      const prices = data.skus.map(s => s.price);
      data.minPrice = Math.min(...prices);
      data.maxPrice = Math.max(...prices);
    }
    const product = await Product.findOneAndUpdate(
      { _id: id, shopId: shop._id }, data, { new: true }
    );
    if (!product) return res.json(fail('Product not found'));
    res.json(success(product, 'Product updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.up = async (req, res) => {
  try {
    const { id, status } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    const product = await Product.findOneAndUpdate(
      { _id: id, shopId: shop._id }, { status }, { new: true }
    );
    if (!product) return res.json(fail('Product not found'));
    res.json(success(product, status === 1 ? 'Product listed' : 'Product unlisted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.distribute = async (req, res) => {
  try {
    const { productId, markupPercentage = 20 } = req.body;
    const srcProduct = await Product.findById(productId);
    if (!srcProduct) return res.json(fail('Source product not found'));
    if (srcProduct.status !== 1) return res.json(fail('Source product is not active'));

    const shop = await Shop.findOne({ userId: req.user._id, status: 1 });
    if (!shop) return res.json(fail('You need an approved store to distribute products'));

    const markup = Number(markupPercentage) || 20;
    const markupMultiplier = 1 + markup / 100;

    const newSkus = (srcProduct.skus || []).map(sku => ({
      attrs: (sku.attrs || []).map(a => ({ name: a.name, value: a.value })),
      price: Math.round(sku.price * markupMultiplier * 100) / 100,
      originalPrice: sku.originalPrice ? Math.round(sku.originalPrice * markupMultiplier * 100) / 100 : 0,
      stock: sku.stock || 0,
      image: sku.image || '',
      weight: sku.weight || 0,
      cost: sku.price,
    }));

    const prices = newSkus.map(s => s.price);

    const newProduct = await Product.create({
      name: srcProduct.name,
      description: srcProduct.description,
      images: srcProduct.images || [],
      categoryId: srcProduct.categoryId,
      shopId: shop._id,
      skus: newSkus,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      originalPrice: Math.max(...prices),
      salesCount: 0,
      reviewCount: 0,
      rating: 5,
      tags: srcProduct.tags || [],
      status: 1,
    });

    await Shop.findByIdAndUpdate(shop._id, { $inc: { productCount: 1 } });

    res.json(success({
      product: newProduct,
      retailPrice: Math.min(...prices),
    }, 'Product distributed successfully.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
