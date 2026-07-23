const fs = require('fs');
const path = require('path');

const productsJson = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', '..', 'products_with_images.json'), 'utf8'
));

// Build product data for seeder
const products = productsJson.map((p, i) => {
  return {
    name: p.Name,
    image: p.imageFile,
    price: p.Price,
    description: `High quality ${p.Name} at great price. Shop now!`
  };
});

// Category classification based on product name keywords
function classifyProduct(name) {
  const lower = name.toLowerCase();
  if (lower.includes('phone') || lower.includes('smartphone') || lower.includes('mobile')) return 3; // Smartphones
  if (lower.includes('laptop') || lower.includes('computer')) return 4; // Laptops
  if (lower.includes('earbud') || lower.includes('headphone') || lower.includes('speaker')) return 5; // Headphones
  if (lower.includes('gift card') || lower.includes('spotify') || lower.includes('razor') || lower.includes('razor gold') || lower.includes('hm gift') || lower.includes('h&m gift')) return 5; // Gift cards -> Headphones (digital)
  if (lower.includes('scale') || lower.includes('thermometer') || lower.includes('blood pressure') || lower.includes('monitor')) return 3; // Electronics -> Smartphones (health)
  if (lower.includes('neck care') || lower.includes('neck') || lower.includes('massag')) return 3; // Electronics
  if (lower.includes('dress') || lower.includes('skirt') || lower.includes('top') || lower.includes('blouse') || lower.includes('shirt') || lower.includes('sweater') || lower.includes('hoodie') || lower.includes('jacket') || lower.includes('coat') || lower.includes('suit') || lower.includes('trench') || lower.includes('jeans') || lower.includes('pants') || lower.includes('shorts') || lower.includes('set') || lower.includes('outfit') || lower.includes('wear') || lower.includes('cloth') || lower.includes('garment') || lower.includes('sweatshirt') || lower.includes('jogger') || lower.includes('qipao') || lower.includes('cheongsam') || lower.includes('hanfu')) return 1; // Women Clothing
  if (lower.includes('shoe') || lower.includes('sneaker')) return 2; // Shoes
  if (lower.includes('skincare') || lower.includes('serum') || lower.includes('moisturizer') || lower.includes('lipstick') || lower.includes('makeup')) return 8; // Makeup
  if (lower.includes('yoga') || lower.includes('fitness') || lower.includes('gym') || lower.includes('dumbbell') || lower.includes('running') || lower.includes('sport')) return 9; // Fitness
  if (lower.includes('toy') || lower.includes('block') || lower.includes('kid')) return 5; // Headphones (catch-all)
  return 1; // Default: Women Clothing (most products are clothing)
}

// Generate seeder content
let code = `const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Banner = require('../models/Banner');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Promise.all([
      User.deleteMany({}), Category.deleteMany({}),
      Product.deleteMany({}), Shop.deleteMany({}),
      Banner.deleteMany({}), Cart.deleteMany({}),
      Wallet.deleteMany({}),
    ]);

    const admin = await User.create({
      username: 'admin', email: 'admin@shopifywholesale.com',
      password: 'admin123', role: 'admin',
    });

    const buyer = await User.create({
      username: 'buyer', email: 'buyer@shopifywholesale.com',
      password: 'buyer123', role: 'buyer',
    });

    const seller = await User.create({
      username: 'seller', email: 'seller@shopifywholesale.com',
      password: 'seller123', role: 'seller',
    });

    await Cart.create({ userId: buyer._id, items: [] });
    await Cart.create({ userId: seller._id, items: [] });
    await Wallet.create({ userId: buyer._id, balance: 10000 });
    await Wallet.create({ userId: seller._id, balance: 50000 });

    const shop = await Shop.create({
      userId: seller._id, name: 'Global Fashion Store',
      description: 'Best fashion products from around the world',
      logo: '', status: 1, rating: 4.5, salesCount: 1523, productCount: 0, followerCount: 845,
    });

    const categories = await Category.create([
      { name: 'Fashion', level: 1, icon: '', sort: 1 },
      { name: 'Electronics', level: 1, icon: '', sort: 2 },
      { name: 'Home & Living', level: 1, icon: '', sort: 3 },
      { name: 'Beauty', level: 1, icon: '', sort: 4 },
      { name: 'Sports', level: 1, icon: '', sort: 5 },
    ]);

    const subCats = await Category.create([
      { name: 'Men Clothing', parentId: categories[0]._id, level: 2, sort: 1 },
      { name: 'Women Clothing', parentId: categories[0]._id, level: 2, sort: 2 },
      { name: 'Shoes', parentId: categories[0]._id, level: 2, sort: 3 },
      { name: 'Smartphones', parentId: categories[1]._id, level: 2, sort: 1 },
      { name: 'Laptops', parentId: categories[1]._id, level: 2, sort: 2 },
      { name: 'Headphones', parentId: categories[1]._id, level: 2, sort: 3 },
      { name: 'Furniture', parentId: categories[2]._id, level: 2, sort: 1 },
      { name: 'Skincare', parentId: categories[3]._id, level: 2, sort: 1 },
      { name: 'Makeup', parentId: categories[3]._id, level: 2, sort: 2 },
      { name: 'Fitness', parentId: categories[4]._id, level: 2, sort: 1 },
    ]);

    const productData = ${JSON.stringify(products, null, 6).replace(/\n\s{6}/g, '\n      ')};

    const createdProducts = [];
    for (let i = 0; i < productData.length; i++) {
      const p = productData[i];
      const catIdx = ${JSON.stringify(products.map(p => classifyProduct(p.name)))};
      const subCat = subCats[catIdx[i]];
      const originalPrice = Math.round(p.price * (1.2 + Math.random() * 0.3) * 100) / 100;
      const product = await Product.create({
        name: p.name,
        description: p.description,
        images: [p.image],
        categoryId: subCat._id,
        shopId: shop._id,
        skus: [
          {
            attrs: [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Black' }],
            price: p.price, originalPrice: originalPrice,
            stock: Math.floor(Math.random() * 200) + 50,
          },
          {
            attrs: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'White' }],
            price: p.price, originalPrice: originalPrice,
            stock: Math.floor(Math.random() * 200) + 50,
          },
          {
            attrs: [{ name: 'Size', value: 'L' }, { name: 'Color', value: 'Blue' }],
            price: Math.round(p.price * 1.1 * 100) / 100,
            originalPrice: Math.round(originalPrice * 1.1 * 100) / 100,
            stock: Math.floor(Math.random() * 200) + 50,
          },
        ],
        minPrice: p.price,
        maxPrice: Math.round(p.price * 1.1 * 100) / 100,
        salesCount: Math.floor(Math.random() * 500) + 10,
        reviewCount: Math.floor(Math.random() * 100) + 5,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        status: 1,
        isHot: i < 20,
        isRecommended: i >= 20 && i < 40,
      });
      createdProducts.push(product);
      if ((i + 1) % 20 === 0) console.log(\`  Created \${i + 1} products\`);
    }

    await Shop.findByIdAndUpdate(shop._id, { productCount: createdProducts.length });

    await Banner.create([
      { title: 'Summer Sale - Up to 70% Off', image: '/uploads/banner1.jpg', link: '/miaoshalist', sort: 1, position: 'home' },
      { title: 'New Arrivals Fashion 2026', image: '/uploads/banner2.jpg', link: '/tuijianlist', sort: 2, position: 'home' },
      { title: 'Electronics Mega Deals', image: '/uploads/banner3.jpg', link: '/remenglist', sort: 3, position: 'home' },
      { title: 'Beauty & Skincare Special', image: '/uploads/banner4.jpg', link: '/searchgoods?keyword=beauty', sort: 4, position: 'home' },
      { title: 'Sports & Outdoors Collection', image: '/uploads/banner5.jpg', link: '/searchgoods?keyword=sports', sort: 5, position: 'home' },
    ]);

    console.log('Seed data created successfully');
    console.log(\`  Admin: admin@shopifywholesale.com / admin123\`);
    console.log(\`  Buyer: buyer@shopifywholesale.com / buyer123\`);
    console.log(\`  Seller: seller@shopifywholesale.com / seller123\`);
    console.log(\`  \${createdProducts.length} products created\`);
    console.log(\`  \${categories.length} categories created\`);
    console.log(\`  \${subCats.length} sub-categories created\`);

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
`;

fs.writeFileSync(path.join(__dirname, '..', 'seed', 'seeder.js'), code);
console.log('Seeder generated successfully!');
console.log(`Total products: ${products.length}`);
