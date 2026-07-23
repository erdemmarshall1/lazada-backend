const mongoose = require('mongoose')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')

const envPath = path.resolve(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  })
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/lazada'

async function urlExists(url, timeout = 10000) {
  return new Promise(resolve => {
    if (!url || typeof url !== 'string') return resolve(false)
    const protocol = url.startsWith('https') ? https : http
    const req = protocol.get(url, { method: 'HEAD', timeout }, res => {
      resolve(res.statusCode >= 200 && res.statusCode < 400)
    })
    req.on('error', () => resolve(false))
    req.on('timeout', () => { req.destroy(); resolve(false) })
  })
}

async function main() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB')

    const db = mongoose.connection.db
    const products = await db.collection('products').find({}).toArray()
    console.log(`Total products: ${products.length}`)

    const results = []
    const cdnProducts = products.filter(p => {
      const img = p.images?.[0] || p.image || p.img
      return img && (img.includes('popularity1.shop') || img.includes('s3.amazonaws.com'))
    })
    console.log(`Products with remote CDN images: ${cdnProducts.length}`)

    const localProducts = products.filter(p => {
      const img = p.images?.[0] || p.image || p.img
      return img && !img.includes('popularity1.shop') && !img.includes('s3.amazonaws.com')
    })
    console.log(`Products with local images: ${localProducts.length}`)

    const noImageProducts = products.filter(p => {
      const img = p.images?.[0] || p.image || p.img
      return !img
    })
    console.log(`Products with no images: ${noImageProducts.length}`)

    let brokenCount = 0
    let workingCount = 0

    for (const p of cdnProducts.slice(0, 500)) {
      const img = p.images?.[0] || p.image || p.img
      if (!img) continue
      const exists = await urlExists(img)
      if (exists) {
        workingCount++
      } else {
        brokenCount++
        results.push({ _id: p._id, name: p.name, image: img, minPrice: p.minPrice })
      }
      if ((brokenCount + workingCount) % 50 === 0) {
        console.log(`Checked ${brokenCount + workingCount}/${Math.min(cdnProducts.length, 500)} CDN images... (${brokenCount} broken)`)
      }
    }

    console.log(`\n--- Scan Complete ---`)
    console.log(`Checked: ${brokenCount + workingCount} CDN images`)
    console.log(`Working: ${workingCount}`)
    console.log(`Broken: ${brokenCount}`)

    const totalAllImages = products.filter(p => {
      const img = p.images?.[0] || p.image || p.img
      return !!img
    }).length
    console.log(`Total products with ANY image: ${totalAllImages}`)
    console.log(`Total products with NO image: ${noImageProducts.length}`)

    const reportPath = path.resolve(__dirname, 'broken_images_report.json')
    fs.writeFileSync(reportPath, JSON.stringify({
      scannedAt: new Date().toISOString(),
      totalProducts: products.length,
      withRemoteCDN: cdnProducts.length,
      withLocalImages: localProducts.length,
      withNoImages: noImageProducts.length,
      checkedRemotes: brokenCount + workingCount,
      workingRemotes: workingCount,
      brokenRemotes: brokenCount,
      brokenProducts: results,
    }, null, 2))
    console.log(`\nReport saved to: ${reportPath}`)

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()
