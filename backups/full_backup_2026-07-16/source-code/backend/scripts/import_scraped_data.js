const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const Category = require('../models/Category')
const Banner = require('../models/Banner')
const Product = require('../models/Product')
const Shop = require('../models/Shop')
const User = require('../models/User')
const Cart = require('../models/Cart')
const Wallet = require('../models/Wallet')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_wholesale'
const UPLOADS_BASE = path.resolve(__dirname, '..', 'uploads')

// ===== DATA =====

const categoriesData = [
  { name: 'Lifestyle', icon: '/uploads/category/Lifestyle.png', sort: 1 },
  { name: 'Men Shoes', icon: '/uploads/category/Men_Shoes.png', sort: 2 },
  { name: 'Women Shoes', icon: '/uploads/category/Women_Shoes.png', sort: 3 },
  { name: 'Accessories', icon: '/uploads/category/Accessories.png', sort: 4 },
  { name: 'Men Clothing', icon: '/uploads/category/Men_Clothing.png', sort: 5 },
  { name: 'Women Bags', icon: '/uploads/category/Women_Bags.png', sort: 6 },
  { name: 'Men Bags', icon: '/uploads/category/Men_Bags.png', sort: 7 },
  { name: 'Women Clothing', icon: '/uploads/category/Women_Clothing.png', sort: 8 },
  { name: 'Girls', icon: '/uploads/category/Girls.png', sort: 9 },
  { name: 'Boys', icon: '/uploads/category/Boys.png', sort: 10 },
  { name: 'Global Purchase', icon: '/uploads/category/Global_Purchase.png', sort: 11 },
]

const bannersData = [
  { title: 'Banner 1', image: '/uploads/banners/banner_1.jpg', sort: 1, position: 'home', status: 1 },
  { title: 'Banner 2', image: '/uploads/banners/banner_2.jpg', sort: 2, position: 'home', status: 1 },
  { title: 'Banner 3', image: '/uploads/banners/banner_3.jpg', sort: 3, position: 'home', status: 1 },
  { title: 'Banner 4', image: '/uploads/banners/banner_4.jpg', sort: 4, position: 'home', status: 1 },
]

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
]

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
]

function parsePrice(str) {
  return parseFloat(str.replace(/,/g, ''))
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB:', MONGODB_URI)
    return
  } catch (err) {
    console.log(`MongoDB connection failed: ${err.message}`)
    console.log('Starting in-memory MongoDB...')
    const { MongoMemoryServer } = require('mongodb-memory-server')
    const mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
    console.log('Connected to in-memory MongoDB:', uri)
  }
}

async function ensureBaseData() {
  const userCount = await User.countDocuments()
  if (userCount > 0) return

  console.log('Seeding base users, shops, carts, wallets...')
  const admin = await User.create({ username: 'admin', email: 'admin@shopifywholesale.com', password: 'admin123', role: 'admin' })
  const buyer = await User.create({ username: 'buyer', email: 'buyer@shopifywholesale.com', password: 'buyer123', role: 'buyer' })
  const seller = await User.create({ username: 'seller', email: 'seller@shopifywholesale.com', password: 'seller123', role: 'seller' })
  await Cart.create({ userId: buyer._id, items: [] })
  await Cart.create({ userId: seller._id, items: [] })
  await Wallet.create({ userId: buyer._id, balance: 10000 })
  await Wallet.create({ userId: seller._id, balance: 50000 })

  const shopNames = ['Global Fashion Store', 'Tech Haven', 'Fashion Forward', 'Home & Living Co.', 'Sports Central', 'Beauty Bloom', 'Gadget Galaxy', 'Luxury Boutique']
  for (let i = 0; i < shopNames.length; i++) {
    const u = i === 0 ? seller : await User.create({
      username: `seller${i + 1}`, email: `seller${i + 1}@shopifywholesale.com`,
      password: 'seller123', role: 'seller',
    })
    if (i > 0) {
      await Cart.create({ userId: u._id, items: [] })
      await Wallet.create({ userId: u._id, balance: 10000 })
    }
    await Shop.create({
      userId: u._id, name: shopNames[i],
      description: `Best products from ${shopNames[i]}`,
      status: 1, rating: 4 + Math.random(), salesCount: Math.floor(Math.random() * 3000),
      productCount: 0, followerCount: Math.floor(Math.random() * 1500),
    })
  }
  console.log(`Seeded ${await User.countDocuments()} users, ${await Shop.countDocuments()} shops`)
}

async function main() {
  console.log('Connecting...')
  await connectDB()
  console.log('Connected.')
  await ensureBaseData()

  // 1. UPSERT CATEGORIES
  console.log('\n--- Categories ---')
  const catMap = {}  // name -> categoryId
  for (const c of categoriesData) {
    let cat = await Category.findOne({ name: c.name })
    if (cat) {
      cat.icon = c.icon
      await cat.save()
      console.log(`  [UPDATE] ${c.name}`)
    } else {
      cat = await Category.create({ ...c, status: 1 })
      console.log(`  [CREATE] ${c.name}`)
    }
    catMap[c.name] = cat._id
  }
  console.log(`  Total: ${Object.keys(catMap).length} categories`)

  // 2. UPSERT BANNERS
  console.log('\n--- Banners ---')
  await Banner.deleteMany({})  // Clear old banners
  for (const b of bannersData) {
    await Banner.create(b)
    console.log(`  [CREATE] ${b.title}`)
  }
  console.log(`  Total: ${bannersData.length} banners`)

  // 3. FIND OR CREATE DEFAULT SHOP
  console.log('\n--- Default Shop ---')
  let shop = await Shop.findOne({ name: 'THE OUTNET CN' })
  if (!shop) {
    // Find an admin user
    let admin = await User.findOne({ role: 'admin' })
    if (!admin) {
      admin = await User.findOne({})
    }
    if (!admin) {
      console.log('  [ERROR] No user found to assign shop. Run seeder first.')
      process.exit(1)
    }
    shop = await Shop.create({
      userId: admin._id,
      name: 'THE OUTNET CN',
      description: 'Luxury fashion at wholesale prices',
      status: 1,
    })
    console.log(`  [CREATE] Shop: ${shop.name}`)
  } else {
    console.log(`  [EXISTS] Shop: ${shop.name}`)
  }

  // 4. IMPORT HOT PRODUCTS (Women Bags category)
  console.log('\n--- Hot Products ---')
  const womenBagsId = catMap['Women Bags']
  let hotCount = 0
  for (const p of hotProductsData) {
    const existing = await Product.findOne({ name: p.title })
    if (existing) {
      console.log(`  [SKIP] ${p.title}`)
      continue
    }
    const price = parsePrice(p.price)
    await Product.create({
      name: p.title,
      description: p.title,
      images: [p.image],
      categoryId: womenBagsId,
      shopId: shop._id,
      skus: [{ price, originalPrice: Math.round(price * 1.3 * 100) / 100, stock: 999 }],
      minPrice: price,
      maxPrice: price,
      originalPrice: Math.round(price * 1.3 * 100) / 100,
      salesCount: p.sales,
      isHot: true,
      status: 1,
    })
    hotCount++
    console.log(`  [CREATE] ${p.title}`)
  }
  console.log(`  Created: ${hotCount} hot products`)

  // 5. IMPORT FIND PRODUCTS
  console.log('\n--- Find Products ---')
  let findCount = 0
  for (const p of findProductsData) {
    const existing = await Product.findOne({ name: p.title })
    if (existing) {
      console.log(`  [SKIP] ${p.title}`)
      continue
    }
    const catId = catMap[p.cat]
    if (!catId) {
      console.log(`  [SKIP] No category "${p.cat}" for ${p.title}`)
      continue
    }
    const price = parsePrice(p.price)
    await Product.create({
      name: p.title,
      description: p.title,
      images: [p.image],
      categoryId: catId,
      shopId: shop._id,
      skus: [{ price, originalPrice: Math.round(price * 1.3 * 100) / 100, stock: 999 }],
      minPrice: price,
      maxPrice: price,
      originalPrice: Math.round(price * 1.3 * 100) / 100,
      salesCount: p.sales,
      isRecommended: true,
      status: 1,
    })
    findCount++
    console.log(`  [CREATE] ${p.title}`)
  }
  console.log(`  Created: ${findCount} find products`)

  console.log('\n=== IMPORT COMPLETE ===')
  console.log(`Categories: ${Object.keys(catMap).length}`)
  console.log(`Banners: ${bannersData.length}`)
  console.log(`Hot Products: ${hotCount}`)
  console.log(`Find Products: ${findCount}`)

  const total = await Product.countDocuments()
  console.log(`Total Products in DB: ${total}`)

  await mongoose.disconnect()
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
