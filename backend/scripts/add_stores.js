const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Cart = require('../models/Cart');
const Wallet = require('../models/Wallet');

const LOGO_PREFIX = 'https://picsum.photos/seed'

const storeDefs = [
  { name: 'Tech Haven', desc: 'Premium electronics and gadgets for tech enthusiasts', rating: 4.7, sales: 2841, followers: 1230, logo: `${LOGO_PREFIX}/techhaven/200/200` },
  { name: 'Fashion Forward', desc: 'Trendy clothing and accessories for every style', rating: 4.3, sales: 1956, followers: 980, logo: `${LOGO_PREFIX}/fashionfwd/200/200` },
  { name: 'Home & Living Co.', desc: 'Everything to make your home beautiful and cozy', rating: 4.6, sales: 1642, followers: 756, logo: `${LOGO_PREFIX}/homeliving/200/200` },
  { name: 'Sports Central', desc: 'Gear up with top-quality sports equipment and apparel', rating: 4.4, sales: 2108, followers: 892, logo: `${LOGO_PREFIX}/sports/200/200` },
  { name: 'Beauty Bloom', desc: 'Skincare, makeup, and beauty essentials', rating: 4.8, sales: 3215, followers: 1567, logo: `${LOGO_PREFIX}/beautybloom/200/200` },
  { name: 'Book Nook', desc: 'Discover your next great read from our curated collection', rating: 4.2, sales: 987, followers: 534, logo: `${LOGO_PREFIX}/booknook/200/200` },
  { name: 'Gadget Galaxy', desc: 'Latest tech innovations and smart devices', rating: 4.5, sales: 2534, followers: 1102, logo: `${LOGO_PREFIX}/gadgetgalaxy/200/200` },
]

async function addStores() {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB')

  let created = 0
  for (let i = 0; i < storeDefs.length; i++) {
    const def = storeDefs[i]
    const existing = await Shop.findOne({ name: def.name })
    if (existing) {
      console.log(`  SKIP: "${def.name}" already exists`)
      continue
    }
    const username = `seller${i + 2}`
    let user = await User.findOne({ username })
    if (!user) {
      user = await User.create({
        username, email: `${username}@shopifywholesale.com`,
        password: 'seller123', role: 'seller',
      })
    }
    const existingCart = await Cart.findOne({ userId: user._id })
    if (!existingCart) await Cart.create({ userId: user._id, items: [] })
    const existingWallet = await Wallet.findOne({ userId: user._id })
    if (!existingWallet) await Wallet.create({ userId: user._id, balance: 10000 })
    await Shop.create({
      userId: user._id, name: def.name, description: def.desc,
      logo: def.logo, status: 1, rating: def.rating,
      salesCount: def.sales, productCount: 0, followerCount: def.followers,
      storeNumber: `S${String(i + 2).padStart(5, '0')}`,
    })
    console.log(`  CREATED: "${def.name}" (user: ${username})`)
    created++
  }

  console.log(`\nDone. ${created} stores created.`)
  await mongoose.disconnect()
  process.exit(0)
}

addStores().catch(err => { console.error(err); process.exit(1) })
