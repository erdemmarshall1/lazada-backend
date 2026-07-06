const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const Category = require('../models/Category');
const Shop = require('../models/Shop');
const Banner = require('../models/Banner');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_wholesale';

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clean existing data
  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Shop.deleteMany({}),
    Banner.deleteMany({}),
  ]);

  // Create users
  const admin = await User.create({ username: 'admin', email: 'admin@shopifywholesale.com', password: 'admin123', role: 'admin' });
  const buyer = await User.create({ username: 'buyer', email: 'buyer@shopifywholesale.com', password: 'buyer123', role: 'buyer' });
  const seller = await User.create({ username: 'seller', email: 'seller@shopifywholesale.com', password: 'seller123', role: 'seller' });
  await Cart.create({ userId: buyer._id, items: [] });
  await Cart.create({ userId: seller._id, items: [] });
  await Wallet.create({ userId: buyer._id, balance: 10000 });
  await Wallet.create({ userId: seller._id, balance: 50000 });

  // Create shops
  const shopNames = [
    'Global Fashion Store', 'Tech Haven', 'Fashion Forward', 'Home & Living Co.',
    'Sports Central', 'Beauty Bloom', 'Gadget Galaxy', 'Luxury Boutique'
  ];
  const shops = [];
  for (let i = 0; i < shopNames.length; i++) {
    const u = i === 0 ? seller : await User.create({
      username: `seller${i + 1}`, email: `seller${i + 1}@shopifywholesale.com`,
      password: 'seller123', role: 'seller',
    });
    if (i > 0) {
      await Cart.create({ userId: u._id, items: [] });
      await Wallet.create({ userId: u._id, balance: 10000 });
    }
    const shop = await Shop.create({
      userId: u._id, name: shopNames[i],
      description: `Best products from ${shopNames[i]}`,
      logo: `https://picsum.photos/seed/shop${i}/200/200`,
      status: 1, rating: 4 + Math.random(), salesCount: Math.floor(Math.random() * 3000),
      productCount: 0, followerCount: Math.floor(Math.random() * 1500),
    });
    shops.push(shop);
  }
  console.log(`Created ${shops.length} shops`);

  // Create categories
  const mainCats = await Category.create([
    { name: 'Fashion', level: 1, sort: 1 },
    { name: 'Electronics', level: 1, sort: 2 },
    { name: 'Home & Living', level: 1, sort: 3 },
    { name: 'Beauty', level: 1, sort: 4 },
    { name: 'Sports', level: 1, sort: 5 },
    { name: 'Gift Cards', level: 1, sort: 6 },
  ]);

  const subCats = await Category.create([
    { name: 'Women Clothing', parentId: mainCats[0]._id, level: 2, sort: 1 },
    { name: 'Men Clothing', parentId: mainCats[0]._id, level: 2, sort: 2 },
    { name: 'Shoes', parentId: mainCats[0]._id, level: 2, sort: 3 },
    { name: 'Bags & Accessories', parentId: mainCats[0]._id, level: 2, sort: 4 },
    { name: 'Smartphones', parentId: mainCats[1]._id, level: 2, sort: 1 },
    { name: 'Laptops & Tablets', parentId: mainCats[1]._id, level: 2, sort: 2 },
    { name: 'Headphones & Audio', parentId: mainCats[1]._id, level: 2, sort: 3 },
    { name: 'Furniture', parentId: mainCats[2]._id, level: 2, sort: 1 },
    { name: 'Skincare', parentId: mainCats[3]._id, level: 2, sort: 1 },
    { name: 'Makeup', parentId: mainCats[3]._id, level: 2, sort: 2 },
    { name: 'Fitness', parentId: mainCats[4]._id, level: 2, sort: 1 },
    { name: 'Digital Cards', parentId: mainCats[5]._id, level: 2, sort: 1 },
  ]);
  console.log(`Created ${mainCats.length + subCats.length} categories`);

  // Load product data
  const dataPath = path.join(__dirname, '..', '..', 'products_with_images.json');
  const rawProducts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${rawProducts.length} products from products_with_images.json`);

  // Gather all available images from uploads
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  let allImages = [];
  if (fs.existsSync(uploadsDir)) {
    allImages = fs.readdirSync(uploadsDir)
      .filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f))
      .map(f => '/uploads/' + f);
  }
  // Also check Products/ directory
  const productsDir = path.join(__dirname, '..', '..', 'Products');
  let productsImages = [];
  if (fs.existsSync(productsDir)) {
    productsImages = fs.readdirSync(productsDir)
      .filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f))
      .map(f => '/Products/' + f);
  }
  // Also check local_assets/all_images/
  const localDir = path.join(__dirname, '..', '..', 'local_assets', 'all_images');
  let localImages = [];
  if (fs.existsSync(localDir)) {
    localImages = fs.readdirSync(localDir)
      .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f))
      .map(f => '/local_assets/all_images/' + f);
  }

  const allAvailableImages = [...allImages, ...productsImages, ...localImages];
  console.log(`Total available images: ${allAvailableImages.length}`);

  // Category assignment based on product categoryId in the data
  const catMap = {
    '6a37c9f8dbe8962ad94592e0': subCats[0], // Fashion -> Women Clothing
    '6a37c9f8dbe8962ad94592e1': subCats[1], // Men Clothing
    '6a37c9f8dbe8962ad94592e2': subCats[4], // Electronics -> Smartphones
    '6a37c9f8dbe8962ad94592e3': subCats[7], // Furniture
    '6a37c9f8dbe8962ad94592e4': subCats[11], // Gift Cards -> Digital Cards
  };

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Gray', 'Beige', 'Pink', 'Brown'];

  let created = 0;
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const catId = p.categoryId || '6a37c9f8dbe8962ad94592e0';
    const category = catMap[catId] || subCats[0];
    const shop = shops[i % shops.length];

    // Assign images: prefer the one from the data, otherwise cycle from pool
    let productImages = [];
    if (p.imageFile && allImages.includes(p.imageFile)) {
      productImages.push(p.imageFile);
    }
    // Add additional unique images from the pool
    const idx = i % allAvailableImages.length;
    const primaryImg = allAvailableImages[idx];
    if (!productImages.includes(primaryImg)) {
      productImages.unshift(primaryImg);
    }
    if (productImages.length === 0) {
      productImages.push('/uploads/product_' + (i % 100) + '.png');
    }
    // Add a second image if available
    const idx2 = (i + 100) % allAvailableImages.length;
    const img2 = allAvailableImages[idx2];
    if (img2 && !productImages.includes(img2) && productImages.length < 3) {
      productImages.push(img2);
    }

    const price = Math.round(p.Price * 100) / 100;
    const originalPrice = p.OriginalPrice > price ? Math.round(p.OriginalPrice * 100) / 100 : Math.round(price * 1.35 * 100) / 100;

    // Determine category based on product name keywords for better matching
    const name = p.Name || '';
    let subCategory = category;
    if (name.match(/phone|smartphone|iphone|mobile|5g|galaxy|pixel/i)) subCategory = subCats[4];
    else if (name.match(/laptop|macbook|notebook|tablet|ipad/i)) subCategory = subCats[5];
    else if (name.match(/headphone|earphone|airpod|speaker|earbud|audio/i)) subCategory = subCats[6];
    else if (name.match(/shoe|sneaker|boot|heel|sandals/i)) subCategory = subCats[2];
    else if (name.match(/bag|handbag|backpack|wallet|purse|accessor/i)) subCategory = subCats[3];
    else if (name.match(/men|m\.|male|man\b/i) && !name.match(/women|wom|female/i)) subCategory = subCats[1];
    else if (name.match(/furniture|chair|table|sofa|bed|desk|shelf/i)) subCategory = subCats[7];
    else if (name.match(/skin|cream|lotion|serum|facial|moisturizer|sunscreen|beauty/i)) subCategory = subCats[8];
    else if (name.match(/makeup|lipstick|foundation|mascara|eyeshadow|blush/i)) subCategory = subCats[9];
    else if (name.match(/gym|fitness|yoga|workout|exercise|sport|running|trainer/i)) subCategory = subCats[10];
    else if (name.match(/gift card|voucher|spotify|itunes|google play|razer gold|giftcard/i)) subCategory = subCats[11];

    // Create SKUs
    const skuCount = 2 + Math.floor(Math.random() * 2); // 2-3 SKUs
    const skus = [];
    for (let s = 0; s < skuCount; s++) {
      const skuPrice = Math.round(price * (1 + s * 0.05) * 100) / 100;
      const skuOrigPrice = Math.round(originalPrice * (1 + s * 0.05) * 100) / 100;
      skus.push({
        attrs: [
          { name: 'Size', value: sizes[(i + s) % sizes.length] },
          { name: 'Color', value: colors[(i + s * 3) % colors.length] },
        ],
        price: skuPrice,
        originalPrice: skuOrigPrice,
        stock: Math.floor(Math.random() * 300) + 30,
        weight: Math.round(Math.random() * 500 + 100),
        cost: Math.round(skuPrice * 0.65 * 100) / 100,
      });
    }

    const product = await Product.create({
      name: p.Name,
      description: p.description || `High quality ${p.Name} at great price. Shop now!`,
      images: productImages,
      categoryId: subCategory._id,
      shopId: shop._id,
      skus,
      salesCount: Math.floor(Math.random() * 800) + 5,
      reviewCount: Math.floor(Math.random() * 150),
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      status: 1,
      isHot: i < 80,
      isRecommended: i >= 80 && i < 200,
      tags: name.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
    });
    created++;

    if ((i + 1) % 100 === 0) console.log(`  Created ${i + 1}/${rawProducts.length} products`);
  }

  await Shop.findByIdAndUpdate(shops[0]._id, { productCount: created });
  console.log(`Created ${created} products`);

  // Create banners
  const bannerData = [
    { title: 'Summer Sale - Up to 70% Off', image: '/uploads/product_0.png', link: '/miaoshalist', sort: 1 },
    { title: 'New Arrivals Fashion 2026', image: '/uploads/product_1.png', link: '/tuijianlist', sort: 2 },
    { title: 'Electronics Mega Deals', image: '/uploads/product_2.png', link: '/remenglist', sort: 3 },
    { title: 'Beauty & Skincare Special', image: '/uploads/product_3.png', link: '/searchgoods?keyword=beauty', sort: 4 },
    { title: 'Sports & Outdoors Collection', image: '/uploads/product_4.png', link: '/searchgoods?keyword=sports', sort: 5 },
    { title: 'Luxury Fashion Week', image: '/uploads/product_5.png', link: '/searchgoods?keyword=luxury', sort: 6 },
    { title: 'Flash Deals - Limited Time', image: '/uploads/product_6.png', link: '/miaoshalist', sort: 7 },
    { title: 'New Season Essentials', image: '/uploads/product_7.png', link: '/tuijianlist', sort: 8 },
  ];
  for (const b of bannerData) {
    await Banner.create({ ...b, position: 'home', status: 1 });
  }
  console.log(`Created ${bannerData.length} banners`);

  console.log('\n=== Import Complete ===');
  console.log(`Products: ${created}`);
  console.log(`Categories: ${await Category.countDocuments()}`);
  console.log(`Shops: ${await Shop.countDocuments()}`);
  console.log(`Banners: ${await Banner.countDocuments()}`);
  console.log('Login credentials:');
  console.log('  Admin: admin@shopifywholesale.com / admin123');
  console.log('  Buyer: buyer@shopifywholesale.com / buyer123');
  console.log('  Seller: seller@shopifywholesale.com / seller123');

  process.exit(0);
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
