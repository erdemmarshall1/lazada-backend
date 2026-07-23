const mongoose = require('mongoose');

mongoose.set('bufferTimeoutMS', 300000);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (uri && !uri.includes('localhost') && !uri.includes('127.0.0.1')) {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB connected: ${conn.connection.host}`);
      try { await seedFullData(); } catch (e) { console.error('Seed error:', e.message); }
      return true;
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
    }
  }
  console.log('Starting in-memory MongoDB...');
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB started at ${uri}`);
    await seedFullData();
    return true;
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    return false;
  }
};

const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Navy', 'Gray', 'Beige', 'Pink', 'Brown'];

const seedFullData = async () => {
  const Product = require('../models/Product');
  const Category = require('../models/Category');
  const Shop = require('../models/Shop');
  const Banner = require('../models/Banner');
  const User = require('../models/User');
  const Cart = require('../models/Cart');
  const Wallet = require('../models/Wallet');

  const scrapedShop = await Shop.findOne({ name: 'THE OUTNET CN' });
  const scrapedCount = scrapedShop ? await Product.countDocuments({ shopId: scrapedShop._id }) : 0;
  const existingProducts = await Product.countDocuments();
  if (scrapedCount > 0) {
    console.log(`Already have ${scrapedCount} scraped products (${existingProducts} total), skipping seed`);
    return;
  }
  if (existingProducts > 0 && !scrapedShop) {
    console.log(`Database has ${existingProducts} products but no THE OUTNET CN shop, running scraped import only`);
  if (!process.env.SKIP_SCRAPED_SEED) {
    await seedScrapedProducts();
  }
    console.log('Scraped import complete');
    return;
  }

  // Create users
  const admin = await User.create({ username: 'admin', email: 'admin@shopifywholesale.com', password: 'admin123', role: 'admin' });
  await User.create({ username: 'superadmin', email: 'superadmin@shopifywholesale.com', password: 'superadmin123', role: 'super_admin' });
  await User.create({ username: 'alextaylor', email: 'alextaylor11011@gmail.com', password: 'temp123456', role: 'admin', needsPasswordSetup: true });
  const buyer = await User.create({ username: 'buyer', email: 'buyer@shopifywholesale.com', password: 'buyer123', role: 'buyer' });
  const seller = await User.create({ username: 'seller', email: 'seller@shopifywholesale.com', password: 'seller123', role: 'seller' });
  await Cart.create({ userId: buyer._id, items: [] });
  await Cart.create({ userId: seller._id, items: [] });
  await Wallet.create({ userId: buyer._id, balance: 10000 });
  await Wallet.create({ userId: seller._id, balance: 50000 });
  console.log('Seeded users');

  // Create shops
  const shopNames = ['Global Fashion Store', 'Tech Haven', 'Fashion Forward', 'Home & Living Co.', 'Sports Central', 'Beauty Bloom', 'Gadget Galaxy', 'Luxury Boutique'];
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
  console.log(`Seeded ${shops.length} shops`);

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
  console.log(`Seeded ${mainCats.length + subCats.length} categories`);

  // Create scraped categories with icons
  const scrapedCatsData = [
    { name: 'Lifestyle', icon: '/uploads/category/Lifestyle.png', sort: 7 },
    { name: 'Men Shoes', icon: '/uploads/category/Men_Shoes.png', sort: 8 },
    { name: 'Women Shoes', icon: '/uploads/category/Women_Shoes.png', sort: 9 },
    { name: 'Accessories', icon: '/uploads/category/Accessories.png', sort: 10 },
    { name: 'Men Clothing', icon: '/uploads/category/Men_Clothing.png', sort: 11 },
    { name: 'Women Bags', icon: '/uploads/category/Women_Bags.png', sort: 12 },
    { name: 'Men Bags', icon: '/uploads/category/Men_Bags.png', sort: 13 },
    { name: 'Women Clothing', icon: '/uploads/category/Women_Clothing.png', sort: 14 },
    { name: 'Girls', icon: '/uploads/category/Girls.png', sort: 15 },
    { name: 'Boys', icon: '/uploads/category/Boys.png', sort: 16 },
    { name: 'Global Purchase', icon: '/uploads/category/Global_Purchase.png', sort: 17 },
  ];
  const scrapedCats = await Category.create(scrapedCatsData.map(c => ({ ...c, level: 1, status: 1 })));
  const scrapedCatMap = {};
  for (let i = 0; i < scrapedCats.length; i++) {
    scrapedCatMap[scrapedCatsData[i].name] = scrapedCats[i]._id;
  }
  console.log(`Seeded ${scrapedCats.length} scraped categories`);

  // Load 802 products from products_with_images.json
  const dataPath = path.join(__dirname, '..', '..', 'products_with_images.json');
  if (!fs.existsSync(dataPath)) {
    console.log('products_with_images.json not found, falling back to old seed');
    const oldSeed = require('../seed/seeder');
    return;
  }
  const rawProducts = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loading ${rawProducts.length} products`);

  // Collect available images
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  let allImages = [];
  if (fs.existsSync(uploadsDir)) {
    allImages = fs.readdirSync(uploadsDir).filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f)).map(f => '/uploads/' + f);
  }
  const productsDir = path.join(__dirname, '..', '..', 'Products');
  if (fs.existsSync(productsDir)) {
    allImages.push(...fs.readdirSync(productsDir).filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f)).map(f => '/Products/' + f));
  }
  const localDir = path.join(__dirname, '..', '..', 'local_assets', 'all_images');
  if (fs.existsSync(localDir)) {
    allImages.push(...fs.readdirSync(localDir).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f)).map(f => '/local_assets/all_images/' + f));
  }
  if (allImages.length === 0) {
    for (let i = 0; i < 100; i++) allImages.push('/uploads/product_' + i + '.png');
  }
  console.log(`Available images: ${allImages.length}`);

  // Category keyword matching
  const catMap = {
    '6a37c9f8dbe8962ad94592e0': subCats[0],
    '6a37c9f8dbe8962ad94592e1': subCats[1],
    '6a37c9f8dbe8962ad94592e2': subCats[4],
    '6a37c9f8dbe8962ad94592e3': subCats[7],
    '6a37c9f8dbe8962ad94592e4': subCats[11],
  };

  let seeded = 0;
  for (let i = 0; i < rawProducts.length; i++) {
    const p = rawProducts[i];
    const catId = p.categoryId || '6a37c9f8dbe8962ad94592e0';
    let subCategory = catMap[catId] || subCats[0];
    const name = p.Name || '';

    // Smart category assignment based on keywords
    if (name.match(/phone|smartphone|iphone|mobile|5g|galaxy/i)) subCategory = subCats[4];
    else if (name.match(/laptop|macbook|notebook|tablet|ipad/i)) subCategory = subCats[5];
    else if (name.match(/headphone|earphone|airpod|speaker|earbud|audio/i)) subCategory = subCats[6];
    else if (name.match(/shoe|sneaker|boot|heel|sandals/i)) subCategory = subCats[2];
    else if (name.match(/bag|handbag|backpack|wallet|purse|accessor/i)) subCategory = subCats[3];
    else if (name.match(/\bmen\b|male/i) && !name.match(/women|wom|female/i)) subCategory = subCats[1];
    else if (name.match(/furniture|chair|table|sofa|bed|desk/i)) subCategory = subCats[7];
    else if (name.match(/skin|cream|lotion|serum|facial|moisturizer|sunscreen|beauty/i)) subCategory = subCats[8];
    else if (name.match(/makeup|lipstick|foundation|mascara|eyeshadow|blush/i)) subCategory = subCats[9];
    else if (name.match(/gym|fitness|yoga|workout|exercise|sport|running|trainer/i)) subCategory = subCats[10];
    else if (name.match(/gift card|voucher|spotify|itunes|google play|razer gold|giftcard/i)) subCategory = subCats[11];

    const shop = shops[i % shops.length];

    // Assign images
    const productImages = [];
    const idx = i % allImages.length;
    productImages.push(allImages[idx]);
    const idx2 = (i + 100) % allImages.length;
    if (idx2 !== idx && productImages.length < 3) productImages.push(allImages[idx2]);

    const price = Math.round(p.Price * 100) / 100;
    const originalPrice = p.OriginalPrice > price ? Math.round(p.OriginalPrice * 100) / 100 : Math.round(price * 1.35 * 100) / 100;

    const skuCount = 2 + Math.floor(Math.random() * 2);
    const skus = [];
    for (let s = 0; s < skuCount; s++) {
      const skuPrice = Math.round(price * (1 + s * 0.05) * 100) / 100;
      skus.push({
        attrs: [{ name: 'Size', value: sizes[(i + s) % sizes.length] }, { name: 'Color', value: colors[(i + s * 3) % colors.length] }],
        price: skuPrice,
        originalPrice: Math.round(originalPrice * (1 + s * 0.05) * 100) / 100,
        stock: Math.floor(Math.random() * 300) + 30,
        weight: Math.round(Math.random() * 500 + 100),
        cost: Math.round(skuPrice * 0.65 * 100) / 100,
      });
    }

    await Product.create({
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
    seeded++;
    if ((i + 1) % 200 === 0) console.log(`  Seeded ${i + 1}/${rawProducts.length} products`);
  }

  await Shop.findByIdAndUpdate(shops[0]._id, { productCount: seeded });
  console.log(`Seeded ${seeded} products`);

  await seedScrapedProducts();

  // ===== End Bulk Import =====

  // Create banners
  const bannerData = [
    { title: 'Banner 1', image: '/uploads/banners/banner_1.jpg', link: '/', position: 'home', status: 1, sort: 1 },
    { title: 'Banner 2', image: '/uploads/banners/banner_2.jpg', link: '/', position: 'home', status: 1, sort: 2 },
    { title: 'Banner 3', image: '/uploads/banners/banner_3.jpg', link: '/', position: 'home', status: 1, sort: 3 },
    { title: 'Banner 4', image: '/uploads/banners/banner_4.jpg', link: '/', position: 'home', status: 1, sort: 4 },
  ];
  for (const b of bannerData) {
    await Banner.create(b);
  }
  console.log(`Seeded ${bannerData.length} banners`);
};

const seedScrapedProducts = async () => {
  const Product = require('../models/Product');
  const Category = require('../models/Category');
  const Shop = require('../models/Shop');
  const User = require('../models/User');
  const Cart = require('../models/Cart');
  const Wallet = require('../models/Wallet');

  // Find or create scraped categories
  const scrapedCatsData = [
    { name: 'Lifestyle' }, { name: 'Men Shoes' }, { name: 'Women Shoes' },
    { name: 'Accessories' }, { name: 'Men Clothing' }, { name: 'Women Bags' },
    { name: 'Men Bags' }, { name: 'Women Clothing' }, { name: 'Girls' },
    { name: 'Boys' }, { name: 'Global Purchase' },
  ];
  const scrapedCatMap = {};
  for (const cd of scrapedCatsData) {
    let cat = await Category.findOne({ name: cd.name });
    if (!cat) cat = await Category.create({ name: cd.name, level: 1, status: 1, sort: 99 });
    scrapedCatMap[cd.name] = cat._id;
  }

  // Find or create THE OUTNET CN shop
  let scrapedShop = await Shop.findOne({ name: 'THE OUTNET CN' });
  if (!scrapedShop) {
    let outnetUser = await User.findOne({ username: 'outnet' });
    if (!outnetUser) {
      outnetUser = await User.create({
        username: 'outnet', email: 'outnet@shopifywholesale.com',
        password: 'seller123', role: 'seller',
      });
      await Cart.create({ userId: outnetUser._id, items: [] });
      await Wallet.create({ userId: outnetUser._id, balance: 100000 });
    }
    scrapedShop = await Shop.create({
      userId: outnetUser._id,
      name: 'THE OUTNET CN',
      description: 'Luxury fashion at wholesale prices',
      status: 1, rating: 4.5, salesCount: 50000,
    });
    console.log('Created shop: THE OUTNET CN');
  }

  const parsePrice = (str) => parseFloat(str.replace(/,/g, ''));

  // Hot scraped products
  const hotProductsData = [
    { title: 'Prada Arqué Zipped Shoulder Bag', price: '3,933.81', sales: 16214, image: '/uploads/product_images/hot_1.jpg' },
    { title: 'Furla 1927 Twist-Lock Mini Tote Bag', price: '280.09', sales: 21585, image: '/uploads/product_images/hot_2.jpg' },
    { title: 'Saint Laurent Lou Quilted Mini Shoulder Bag', price: '2,123.60', sales: 23004, image: '/uploads/product_images/hot_3.jpg' },
    { title: 'Karl Lagerfeld Karl Legend Clutch Bag', price: '428.43', sales: 19941, image: '/uploads/product_images/hot_4.jpg' },
    { title: 'Thom Browne Diagonal Stripe Small Shoulder Bag', price: '1,367.24', sales: 18765, image: '/uploads/product_images/hot_5.jpg' },
    { title: 'Saint Laurent Loulou Matelassé Small Shoulder Bag', price: '3,933.81', sales: 16912, image: '/uploads/product_images/hot_6.jpg' },
    { title: 'Bottega Veneta Mount Small Envelope Shoulder Bag', price: '4,213.89', sales: 16224, image: '/uploads/product_images/hot_7.jpg' },
    { title: 'Saint Laurent Loulou Medium Shoulder Bag', price: '4,259.98', sales: 29684, image: '/uploads/product_images/hot_8.jpg' },
    { title: 'Saint Laurent Loulou Matelassé Small Shoulder Bag', price: '3,933.81', sales: 27506, image: '/uploads/product_images/hot_9.jpg' },
    { title: 'Fendi Peekaboo Mini Tote Bag', price: '4,159.95', sales: 22709, image: '/uploads/product_images/hot_10.jpg' },
    { title: 'Prada Logo Plaque Shoulder Bag', price: '4,920.81', sales: 21920, image: '/uploads/product_images/hot_11.jpg' },
    { title: 'Bottega Veneta Foulard Shoulder Bag', price: '5,052.69', sales: 20818, image: '/uploads/product_images/hot_12.jpg' },
    { title: 'Loewe Compact Hammock Bag', price: '4,026.08', sales: 22158, image: '/uploads/product_images/hot_13.jpg' },
    { title: 'Bottega Veneta Cassette Strapped Crossbody Bag', price: '5,052.69', sales: 20985, image: '/uploads/product_images/hot_14.jpg' },
    { title: 'Saint Laurent Jamie 4.3 Logo Plaque Shoulder Bag', price: '5,890.79', sales: 22184, image: '/uploads/product_images/hot_15.jpg' },
    { title: 'Fendi All-Over FF Motif Embellished Baguette Tote Bag', price: '4,733.35', sales: 22447, image: '/uploads/product_images/hot_16.jpg' },
    { title: 'Bottega Veneta Medium Sardine Bag', price: '5,439.84', sales: 22709, image: '/uploads/product_images/hot_17.jpg' },
    { title: 'Gucci Blondie Mini Shoulder Bag', price: '4,274.15', sales: 20985, image: '/uploads/product_images/hot_18.jpg' },
  ];
  const womenBagsId = scrapedCatMap['Women Bags'];
  let hotCount = 0;
  for (const p of hotProductsData) {
    const existing = await Product.findOne({ name: p.title });
    if (existing) continue;
    const price = parsePrice(p.price);
    await Product.create({
      name: p.title, description: p.title, images: [p.image],
      categoryId: womenBagsId, shopId: scrapedShop._id,
      skus: [{ price, originalPrice: Math.round(price * 1.3 * 100) / 100, stock: 999 }],
      salesCount: p.sales, isHot: true, status: 1,
    });
    hotCount++;
  }
  if (hotCount) console.log(`Seeded ${hotCount} hot scraped products`);

  // Find scraped products
  const findProductsData = [
    { title: 'Dolce & Gabbana Eyewear Cat-Eye Glasses', price: '359.29', sales: 19462, image: '/uploads/product_images/find_1.jpg', cat: 'Accessories' },
    { title: 'Lace Up Waist Tuck Knit Dress With Waistband', price: '219.43', sales: 7028, image: '/uploads/product_images/find_2.jpg', cat: 'Women Clothing' },
    { title: 'Tory Burch Kira Chain-Linked Small Shoulder Bag', price: '722.56', sales: 20936, image: '/uploads/product_images/find_3.jpg', cat: 'Women Bags' },
    { title: 'Electric Heated Winter Scarf USB Heating Neck Wrap', price: '402.91', sales: 11562, image: '/uploads/product_images/find_4.jpg', cat: 'Accessories' },
    { title: "Men's Mesh Breathable Summer Hollow Shoes", price: '221.59', sales: 6704, image: '/uploads/product_images/find_5.jpg', cat: 'Men Shoes' },
    { title: 'Linda Farrow X Matthew Williamson Oval Frame Glasses', price: '239.04', sales: 15467, image: '/uploads/product_images/find_6.jpg', cat: 'Accessories' },
    { title: 'Saint Laurent Eyewear Oval Frame Glasses', price: '386.15', sales: 24573, image: '/uploads/product_images/find_7.jpg', cat: 'Accessories' },
    { title: 'Maison Margiela Stitched Logo Stamp Phone Pouch', price: '569.46', sales: 16709, image: '/uploads/product_images/find_8.jpg', cat: 'Men Bags' },
    { title: 'Pearlised Baking Tray Non-Stick Baking Sheet', price: '18.45', sales: 27566, image: '/uploads/product_images/find_9.jpg', cat: 'Lifestyle' },
    { title: "Men's Clothing Fashion Single-breasted Thickened", price: '93.46', sales: 7846, image: '/uploads/product_images/find_10.jpg', cat: 'Men Clothing' },
    { title: 'Tom Ford Eyewear Navigator Frame Sunglasses', price: '336.76', sales: 21826, image: '/uploads/product_images/find_11.jpg', cat: 'Accessories' },
    { title: 'Tory Burch Perry Triple Compartment Tote Bag', price: '619.69', sales: 16242, image: '/uploads/product_images/find_12.jpg', cat: 'Women Bags' },
    { title: 'Baseball Cap With Cotton-silver-fiber Fabric Lining', price: '621.44', sales: 5084, image: '/uploads/product_images/find_13.jpg', cat: 'Accessories' },
    { title: 'Christmas 3D Printed Suit For Men', price: '352.26', sales: 6547, image: '/uploads/product_images/find_14.jpg', cat: 'Men Clothing' },
    { title: 'Wool Driving And Biking Lengthened Goat Leather Gloves', price: '186.34', sales: 7470, image: '/uploads/product_images/find_15.jpg', cat: 'Accessories' },
    { title: 'Gucci Eyewear Square Frame Sunglasses', price: '511.99', sales: 19461, image: '/uploads/product_images/find_16.jpg', cat: 'Accessories' },
    { title: 'Printed Couple High-top Canvas Shoes', price: '529.84', sales: 8321, image: '/uploads/product_images/find_17.jpg', cat: 'Men Shoes' },
    { title: 'Marsèll Girogiro Shoulder Bag', price: '1,162.08', sales: 16003, image: '/uploads/product_images/find_18.jpg', cat: 'Men Bags' },
    { title: 'iPhone 15 - 128GB', price: '1,062.50', sales: 21617, image: '/uploads/product_images/find_19.jpg', cat: 'Global Purchase' },
    { title: 'Moncler Eyewear Shield Frame Sunglasses', price: '254.78', sales: 17653, image: '/uploads/product_images/find_20.jpg', cat: 'Accessories' },
  ];
  let findCount = 0;
  for (const p of findProductsData) {
    const existing = await Product.findOne({ name: p.title });
    if (existing) continue;
    const catId = scrapedCatMap[p.cat];
    if (!catId) continue;
    const price = parsePrice(p.price);
    await Product.create({
      name: p.title, description: p.title, images: [p.image],
      categoryId: catId, shopId: scrapedShop._id,
      skus: [{ price, originalPrice: Math.round(price * 1.3 * 100) / 100, stock: 999 }],
      salesCount: p.sales, isRecommended: true, status: 1,
    });
    findCount++;
  }
  if (findCount) console.log(`Seeded ${findCount} find scraped products`);

  // Bulk Import 26,399 Scraped Products
  const scrapedDetailsFile = path.join(__dirname, '..', 'scripts', 'scraped_details.json');
  const scrapedImageMapFile = path.join(__dirname, '..', 'scripts', 'scraped_image_map.json');
  if (fs.existsSync(scrapedDetailsFile)) {
    const scrapeCatMap = {
      13: 'Boys', 14: 'Girls', 15: 'Accessories',
      16: 'Men Bags', 17: 'Men Clothing', 18: 'Men Shoes',
      20: 'Women Bags', 21: 'Women Clothing', 22: 'Women Shoes',
      23: 'Lifestyle', 24: 'Global Purchase',
    };
    let imageMap = {};
    if (fs.existsSync(scrapedImageMapFile)) {
      imageMap = JSON.parse(fs.readFileSync(scrapedImageMapFile, 'utf8'));
    }
    const allDetails = JSON.parse(fs.readFileSync(scrapedDetailsFile, 'utf8'));
    console.log(`\nImporting ${allDetails.length} scraped products from details file...`);

    const allOrigIds = allDetails.map(p => `${p.mer_id || '0'}_${p.product_id}`);
    const existingDocs = await Product.find({ originalId: { $in: allOrigIds } }).select('originalId').lean();
    const existingSet = new Set(existingDocs.map(d => d.originalId));
    console.log(`  Existing products found: ${existingSet.size}`);

    let imported = 0, skipped = existingSet.size, bulkErrors = 0;
    const bulkBatchSize = 100;
    let bulkBatch = [];
    for (let i = 0; i < allDetails.length; i++) {
      const p = allDetails[i];
      const origId = allOrigIds[i];
      if (p.title && (p.title.includes('REDMAGIC') || p.title.includes('Luxury Car Seat Cover'))) { skipped++; continue; }
      if (existingSet.has(origId)) continue;
      const catName = scrapeCatMap[p.category_id] || 'Uncategorized';
      const catId = scrapedCatMap[catName];
      if (!catId) { bulkErrors++; continue; }
      const price = parseFloat(String(p.sales_price || '0').replace(/,/g, '')) || 0;
      const marketPrice = parseFloat(String(p.market_price || '0').replace(/,/g, '')) || Math.round(price * 1.3 * 100) / 100;
      const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image || '/uploads/product.png'];
      bulkBatch.push({
        name: p.title, description: p.content || p.title, images,
        categoryId: catId, shopId: scrapedShop._id,
        skus: [{ price, originalPrice: marketPrice, stock: p.stock || 999 }],
        salesCount: p.sales || 0, status: 1, isHot: false, isRecommended: false,
        minPrice: price, maxPrice: price, originalPrice: marketPrice,
        originalId: origId,
        tags: (p.title || '').toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
      });
      if (bulkBatch.length >= bulkBatchSize || i === allDetails.length - 1) {
        try {
          await Product.insertMany(bulkBatch);
          imported += bulkBatch.length;
        } catch (e) {
          bulkErrors += bulkBatch.length;
        }
        bulkBatch = [];
        if ((i + 1) % 2000 === 0) console.log(`  Scraped import: ${i + 1}/${allDetails.length} (imported: ${imported}, skipped: ${skipped}, errors: ${bulkErrors})`);
      }
    }
    const totalScraped = await Product.countDocuments({ shopId: scrapedShop._id });
    await Shop.findByIdAndUpdate(scrapedShop._id, { productCount: totalScraped });
    console.log(`Scraped import done: imported=${imported}, skipped=${skipped}, errors=${bulkErrors}`);
    console.log(`Total products in THE OUTNET CN shop: ${totalScraped}`);
  } else {
    console.log('scraped_details.json not found, skipping bulk import');
  }
};

module.exports = connectDB;
