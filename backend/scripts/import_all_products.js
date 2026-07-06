const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')

require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const Product = require('../models/Product')
const Category = require('../models/Category')
const Shop = require('../models/Shop')
const User = require('../models/User')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_wholesale'
const DETAILS_FILE = path.resolve(__dirname, 'scraped_details.json')
const IMAGE_MAP_FILE = path.resolve(__dirname, 'scraped_image_map.json')

const CATEGORY_MAP = {
  13: 'Boys', 14: 'Girls', 15: 'Accessories',
  16: 'Men Bags', 17: 'Men Clothing', 18: 'Men Shoes',
  20: 'Women Bags', 21: 'Women Clothing', 22: 'Women Shoes',
  23: 'Lifestyle', 24: 'Global Purchase'
}

function parsePrice(str) {
  if (!str) return 0
  if (typeof str === 'number') return str
  return parseFloat(str.replace(/,/g, '')) || 0
}

async function ensureCategories() {
  const existing = await Category.find({})
  const existingMap = {}
  existing.forEach(c => { existingMap[c.name] = c })

  const created = []
  for (const [apiId, name] of Object.entries(CATEGORY_MAP)) {
    if (!existingMap[name]) {
      const cat = await Category.create({
        name,
        level: 1,
        sort: parseInt(apiId),
        status: 1,
        icon: `/uploads/category/${name.replace(/\s+/g, '_')}.png`
      })
      existingMap[name] = cat
      created.push(name)
      console.log(`  Created category: ${name}`)
    }
  }
  if (created.length === 0) console.log('  All categories already exist')
  return existingMap
}

async function ensureShop() {
  let shop = await Shop.findOne({ name: 'THE OUTNET CN' })
  if (!shop) {
    let user = await User.findOne({ username: 'outnet' })
    if (!user) {
      user = await User.create({
        username: 'outnet', email: 'outnet@shopifywholesale.com',
        password: 'seller123', role: 'seller'
      })
    }
    shop = await Shop.create({
      userId: user._id,
      name: 'THE OUTNET CN',
      description: 'Luxury fashion at wholesale prices',
      status: 1,
      rating: 4.5,
      salesCount: 0
    })
    console.log('  Created shop: THE OUTNET CN')
  } else {
    console.log('  Found existing shop: THE OUTNET CN')
  }
  return shop
}

async function main() {
  console.log('Connecting to MongoDB...')
  await mongoose.connect(MONGODB_URI)
  console.log('Connected\n')

  if (!fs.existsSync(DETAILS_FILE)) {
    console.error(`Details file not found: ${DETAILS_FILE}`)
    await mongoose.disconnect()
    return
  }

  const details = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'))
  console.log(`Loaded ${details.length} product details\n`)

  // Load image map if available
  let imageMap = {}
  if (fs.existsSync(IMAGE_MAP_FILE)) {
    imageMap = JSON.parse(fs.readFileSync(IMAGE_MAP_FILE, 'utf8'))
    console.log(`Loaded image map with ${Object.keys(imageMap).length} entries\n`)
  }

  console.log('Ensuring categories...')
  const catMap = await ensureCategories()

  console.log('\nEnsuring shop...')
  const shop = await ensureShop()

  console.log('\nImporting products...')
  let imported = 0
  let skipped = 0
  let errors = 0
  const batchSize = 100
  let batch = []

  for (let i = 0; i < details.length; i++) {
    const p = details[i]

    const origId = `${p.mer_id || '0'}_${p.product_id}`
    const existing = await Product.findOne({ originalId: origId })
    if (existing) {
      skipped++
      continue
    }

    const categoryName = CATEGORY_MAP[p.category_id] || 'Uncategorized'
    const category = catMap[categoryName]
    if (!category) {
      errors++
      console.log(`  No category found for product ${p.product_id}: ${categoryName}`)
      continue
    }

    const price = parsePrice(p.sales_price)
    const marketPrice = parsePrice(p.market_price) || Math.round(price * 1.3 * 100) / 100

    const images = imageMap[p.product_id] && imageMap[p.product_id].length > 0
      ? imageMap[p.product_id]
      : [p.image || '']

    const productData = {
      name: p.title,
      description: p.content || p.title,
      images,
      originalId: origId,
      categoryId: category._id,
      shopId: shop._id,
      skus: [{
        price,
        originalPrice: marketPrice,
        stock: p.stock || 999
      }],
      salesCount: p.sales || 0,
      status: 1,
      isHot: false,
      isRecommended: i < 2000,
      tags: p.title.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 5)
    }

    batch.push(productData)

    if (batch.length >= batchSize || i === details.length - 1) {
      try {
        await Product.insertMany(batch)
        imported += batch.length
      } catch (e) {
        errors += batch.length
        console.log(`  Batch error at index ${i}: ${e.message}`)
      }
      batch = []
      if ((i + 1) % 500 === 0) {
        console.log(`  Progress: ${i + 1}/${details.length} (imported: ${imported}, skipped: ${skipped}, errors: ${errors})`)
      }
    }
  }

  // Update shop product count
  const totalProducts = await Product.countDocuments({ shopId: shop._id })
  await Shop.findByIdAndUpdate(shop._id, { productCount: totalProducts })

  console.log('\n=== Import Summary ===')
  console.log(`  Imported: ${imported}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`  Errors: ${errors}`)
  console.log(`  Total products in shop: ${totalProducts}`)

  await mongoose.disconnect()
  console.log('\nDone!')
}

main().catch((e) => {
  console.error('Fatal error:', e)
  mongoose.disconnect().catch(() => {})
})
