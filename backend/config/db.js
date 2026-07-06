const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    console.log('Starting in-memory MongoDB...');
    return await startInMemoryDB();
  }
};

const startInMemoryDB = async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB started at ${uri}`);
    await seedData();
    return true;
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    return false;
  }
};

const seedData = async () => {
  const dataPath = path.join(__dirname, '..', '..', 'Lazada_Full_Backup_2026-06-26', 'database', 'live_data_export.json');
  if (!fs.existsSync(dataPath)) {
    console.log('Seed data not found, skipping');
    return;
  }

  const Product = require('../models/Product');
  const Category = require('../models/Category');
  const Shop = require('../models/Shop');
  const Banner = require('../models/Banner');

  const raw = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const { products: rawProducts, banners: rawBanners } = raw;

  const existingProducts = await Product.countDocuments();
  if (existingProducts > 0) {
    console.log(`Database already has ${existingProducts} products, skipping seed`);
    return;
  }

  const localImages = [];
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter(f => f.match(/^product_\d+\.png$/)).sort((a, b) => {
      return parseInt(a.match(/\d+/)[0]) - parseInt(b.match(/\d+/)[0]);
    });
    files.forEach(f => localImages.push('/uploads/' + f));
  }
  if (localImages.length === 0) {
    for (let i = 0; i < 100; i++) localImages.push('/uploads/product_' + i + '.png');
  }

  const shopIds = new Map();
  for (const p of rawProducts) {
    if (p.shopId && p.shopId._id && !shopIds.has(p.shopId._id)) {
      shopIds.set(p.shopId._id, p.shopId.name || 'Shop');
    }
  }

  const categoryIds = new Map();
  for (const p of rawProducts) {
    const cid = typeof p.categoryId === 'object' && p.categoryId ? p.categoryId._id || p.categoryId : p.categoryId;
    if (cid && !categoryIds.has(cid.toString())) {
      categoryIds.set(cid.toString(), 'Category');
    }
  }

  for (const [id, name] of shopIds) {
    const exists = await Shop.findById(id);
    if (!exists) {
      await Shop.create({ _id: id, userId: id, name, status: 1 });
    }
  }
  console.log(`Seeded ${shopIds.size} shops`);

  for (const [id] of categoryIds) {
    const exists = await Category.findById(id);
    if (!exists) {
      await Category.create({ _id: id, name: 'General', status: 1 });
    }
  }
  console.log(`Seeded ${categoryIds.size} categories`);

  let seeded = 0;
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const catId = typeof p.categoryId === 'object' && p.categoryId ? (p.categoryId._id || p.categoryId) : p.categoryId;
    const shopId = typeof p.shopId === 'object' && p.shopId ? (p.shopId._id || p.shopId) : p.shopId;

    const imagePath = localImages[i % localImages.length];

    const productData = {
      _id: p._id,
      name: p.name,
      description: p.description || '',
      images: [imagePath, ...(p.images || []).slice(1)],
      categoryId: catId,
      shopId: shopId,
      skus: (p.skus || []).map(s => ({
        attrs: s.attrs || [],
        price: s.price || 0,
        originalPrice: s.originalPrice || 0,
        stock: s.stock || 0,
        image: s.image || '',
        weight: s.weight || 0,
        cost: s.cost || 0,
      })),
      salesCount: p.salesCount || 0,
      reviewCount: p.reviewCount || 0,
      rating: p.rating || 5,
      tags: p.tags || [],
      status: p.status ?? 1,
      isHot: p.isHot || false,
      isRecommended: p.isRecommended || false,
      isFlashSale: p.isFlashSale || false,
      flashSalePrice: p.flashSalePrice || 0,
      flashSaleStart: p.flashSaleStart || undefined,
      flashSaleEnd: p.flashSaleEnd || undefined,
      flashSaleStock: p.flashSaleStock || 0,
      profitPercentage: p.profitPercentage || 20,
    };

    if (productData.skus.length > 0) {
      const prices = productData.skus.map(s => s.price);
      productData.minPrice = Math.min(...prices);
      productData.maxPrice = Math.max(...prices);
    }

    await Product.create(productData);
    seeded++;
  }
  console.log(`Seeded ${seeded} products with local images`);

  if (rawBanners && rawBanners.length > 0) {
    const BannerModel = mongoose.models.Banner || mongoose.model('Banner', require('../models/Banner').schema);
    for (const b of rawBanners) {
      const exists = await BannerModel.findById(b._id);
      if (!exists) {
        await BannerModel.create(b);
      }
    }
    console.log(`Seeded ${rawBanners.length} banners`);
  }
};

module.exports = connectDB;
