const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/shopify_wholesale';

const CATEGORY_MAP = {
  13: 'Boys', 14: 'Girls', 15: 'Accessories',
  16: 'Men Bags', 17: 'Men Clothing', 18: 'Men Shoes',
  20: 'Women Bags', 21: 'Women Clothing', 22: 'Women Shoes',
  23: 'Lifestyle', 24: 'Global Purchase',
};

function normalizeTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

function pickBest(products) {
  let best = products[0];
  for (let i = 1; i < products.length; i++) {
    const p = products[i];
    const bestScore = (best.content ? 1 : 0) + best.images.length;
    const pScore = (p.content ? 1 : 0) + p.images.length;
    if (pScore > bestScore) best = p;
    else if (pScore === bestScore && parseFloat(String(p.sales_price || '0').replace(/,/g, '')) < parseFloat(String(best.sales_price || '0').replace(/,/g, '')))
      best = p;
  }
  return best;
}

async function main() {
  console.log(`Connecting to MongoDB...`);
  await mongoose.connect(MONGODB_URI);
  console.log(`Connected: ${mongoose.connection.host}`);

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

  const Product = mongoose.model('Product', productSchema);

  const Category = mongoose.model('Category', new mongoose.Schema({
    name: String, level: Number, status: Number, sort: Number, icon: String,
  }));

  const Shop = mongoose.model('Shop', new mongoose.Schema({
    name: String, userId: { type: mongoose.Schema.Types.ObjectId },
    description: String, status: Number, salesCount: Number,
    rating: Number, productCount: Number,
  }));

  const User = mongoose.model('User', new mongoose.Schema({
    username: String, email: String, password: String, role: String,
  }));
  const Cart = mongoose.model('Cart', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId }, items: [],
  }));
  const Wallet = mongoose.model('Wallet', new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId }, balance: Number,
  }));

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
      console.log('Created outnet user');
    }
    scrapedShop = await Shop.create({
      userId: outnetUser._id, name: 'THE OUTNET CN',
      description: 'Luxury fashion at wholesale prices',
      status: 1, rating: 4.5, salesCount: 50000, productCount: 0,
    });
    console.log('Created THE OUTNET CN shop');
  } else {
    console.log(`Found shop: THE OUTNET CN (id: ${scrapedShop._id})`);
  }

  const scrapedCatsData = [
    'Lifestyle', 'Men Shoes', 'Women Shoes', 'Accessories',
    'Men Clothing', 'Women Bags', 'Men Bags', 'Women Clothing',
    'Girls', 'Boys', 'Global Purchase',
  ];
  const scrapedCatMap = {};
  for (const name of scrapedCatsData) {
    let cat = await Category.findOne({ name });
    if (!cat) cat = await Category.create({ name, level: 1, status: 1, sort: 99 });
    scrapedCatMap[name] = cat._id;
  }
  console.log(`Found/created ${scrapedCatsData.length} categories`);

  const detailsFile = path.join(__dirname, 'scraped_details.json');
  if (!fs.existsSync(detailsFile)) {
    console.error('scraped_details.json not found!');
    process.exit(1);
  }

  const allProducts = JSON.parse(fs.readFileSync(detailsFile, 'utf8'));
  console.log(`\nLoaded ${allProducts.length} products from scraped_details.json`);

  // Step 1: Filter — must have title, price > 0, and at least 1 image
  const step1 = allProducts.filter(p => {
    const title = p.title && p.title.trim();
    const price = parseFloat(String(p.sales_price || '0').replace(/,/g, '')) > 0;
    let images = Array.isArray(p.images) ? p.images.filter(i => i && i.startsWith('http')) : [];
    if (p.image && p.image.startsWith('http') && !images.includes(p.image)) images.unshift(p.image);
    p._images = images;
    p._price = parseFloat(String(p.sales_price || '0').replace(/,/g, '')) || 0;
    p._marketPrice = parseFloat(String(p.market_price || '0').replace(/,/g, '')) || Math.round(p._price * 1.3 * 100) / 100;
    return title && price > 0 && p._images.length > 0;
  });

  const filteredNoImage = allProducts.length - step1.length;
  console.log(`Filtered out ${filteredNoImage} products (no title/price/images)`);

  // Step 2: Dedup by originalId (mer_id + product_id)
  const byOrigId = {};
  for (const p of step1) {
    const id = `${p.mer_id || '0'}_${p.product_id}`;
    const existing = byOrigId[id];
    if (!existing || p._images.length > (existing._images?.length || 0) || (p.content && !existing.content)) {
      byOrigId[id] = p;
    }
  }
  const step2 = Object.values(byOrigId);
  const dedupedById = step1.length - step2.length;
  console.log(`Deduped by originalId: removed ${dedupedById}`);

  // Step 3: Dedup by normalized title
  const byTitle = {};
  for (const p of step2) {
    const key = normalizeTitle(p.title);
    if (!byTitle[key]) byTitle[key] = [];
    byTitle[key].push(p);
  }
  const step3 = Object.values(byTitle).map(group => group.length === 1 ? group[0] : pickBest(group));
  const dedupedByTitle = step2.length - step3.length;
  console.log(`Deduped by title: removed ${dedupedByTitle}`);

  // Step 4: Delete existing THE OUTNET CN products
  const existingCount = await Product.countDocuments({ shopId: scrapedShop._id });
  if (existingCount > 0) {
    const del = await Product.deleteMany({ shopId: scrapedShop._id });
    console.log(`Deleted ${del.deletedCount} existing THE OUTNET CN products`);
  }

  // Step 5: Batch insert
  const BATCH_SIZE = 100;
  let imported = 0, errors = 0;
  let batches = [];

  for (let i = 0; i < step3.length; i++) {
    const p = step3[i];
    const catName = CATEGORY_MAP[p.category_id] || 'Lifestyle';
    const catId = scrapedCatMap[catName];
    if (!catId) { errors++; continue; }

    const description = (p.content && p.content.trim())
      ? p.content.trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').substring(0, 500)
      : `Shop ${p.title} at wholesale prices. Premium quality product available now at THE OUTNET CN.`;

    batches.push({
      name: p.title.trim(),
      description,
      images: p._images,
      categoryId: catId,
      shopId: scrapedShop._id,
      skus: [{
        price: p._price,
        originalPrice: p._marketPrice,
        stock: p.stock || 999,
        weight: 0, cost: 0, image: '',
        attrs: [],
      }],
      minPrice: p._price,
      maxPrice: p._price,
      originalPrice: p._marketPrice,
      salesCount: p.sales || 0,
      reviewCount: 0,
      rating: 5,
      status: 1,
      isHot: false,
      isRecommended: false,
      profitPercentage: 20,
      originalId: `${p.mer_id || '0'}_${p.product_id}`,
      tags: (p.title || '').toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5),
    });

    if (batches.length >= BATCH_SIZE || i === step3.length - 1) {
      try {
        await Product.insertMany(batches);
        imported += batches.length;
      } catch (e) {
        errors += batches.length;
        console.error(`  Batch error at ${i}: ${e.message}`);
      }
      batches = [];
      if ((i + 1) % 2000 === 0 || i === step3.length - 1) {
        console.log(`  Progress: ${i + 1}/${step3.length} (imported: ${imported}, errors: ${errors})`);
      }
    }
  }

  await Shop.findByIdAndUpdate(scrapedShop._id, { productCount: imported });
  const total = await Product.countDocuments({ shopId: scrapedShop._id });
  const allTotal = await Product.countDocuments();

  console.log(`\n=== REIMPORT COMPLETE ===`);
  console.log(`  Total from file:        ${allProducts.length}`);
  console.log(`  Filtered (no img/etc):  ${filteredNoImage}`);
  console.log(`  Deduped (by origId):    ${dedupedById}`);
  console.log(`  Deduped (by title):     ${dedupedByTitle}`);
  console.log(`  Imported:               ${imported}`);
  console.log(`  Errors:                 ${errors}`);
  console.log(`  THE OUTNET CN products: ${total}`);
  console.log(`  Total DB products:      ${allTotal}`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
