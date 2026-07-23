const https = require('https')
const fs = require('fs')
const path = require('path')

const API_BASE = 'https://api.popularity1.shop'
const LISTINGS_FILE = path.resolve(__dirname, 'scraped_listings.json')
const OUTPUT_FILE = path.resolve(__dirname, 'scraped_details.json')
const PROGRESS_FILE = path.resolve(__dirname, 'scraped_details_progress.json')
const CONCURRENT = 20

const CATEGORY_MAP = {
  13: 'Boys', 14: 'Girls', 15: 'Accessories',
  16: 'Men Bags', 17: 'Men Clothing', 18: 'Men Shoes',
  20: 'Women Bags', 21: 'Women Clothing', 22: 'Women Shoes',
  23: 'Lifestyle', 24: 'Global Purchase'
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { timeout: 30000 }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { reject(e) }
      })
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('Timeout')) })
  })
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchDetail(mer_id, product_id) {
  const url = `${API_BASE}/api/product/detail?mer_id=${mer_id}&product_id=${product_id}`
  const resp = await get(url)
  if (resp.code !== 1 || !resp.data) return null
  return resp.data
}

async function worker(queue, results, index) {
  while (true) {
    const item = queue.shift()
    if (!item) break
    try {
      const detail = await fetchDetail(item.mer_id, item.product_id)
      if (detail) {
        const categoryId = detail.goods?.category_id || 0
        results.push({
          id: item.id,
          mer_id: item.mer_id,
          product_id: item.product_id,
          title: item.title,
          sales_price: item.sales_price,
          market_price: item.market_price,
          image: item.image,
          category_id: categoryId,
          category_name: CATEGORY_MAP[categoryId] || 'Uncategorized',
          images: detail.goods?.images ? detail.goods.images.split(',').filter(Boolean) : [],
          content: detail.goods?.content || '',
          stock: detail.goods?.stock || 0,
          sales: detail.sales || item.sales,
          merchant_name: detail.merchant?.mer_name || '',
          merchant_avatar: detail.merchant?.mer_avatar || ''
        })
      } else {
        results.push({
          ...item,
          category_id: 0,
          category_name: 'Uncategorized',
          images: [],
          content: '',
          stock: 0,
          merchant_name: '',
          merchant_avatar: ''
        })
      }
    } catch (e) {
      console.log(`  Worker ${index}: error for product ${item.product_id}: ${e.message}`)
      queue.push(item)
      await sleep(1000)
    }
  }
}

async function main() {
  if (!fs.existsSync(LISTINGS_FILE)) {
    console.error(`Listings file not found: ${LISTINGS_FILE}`)
    console.error('Run scrape_all_listings.js first')
    return
  }

  const listings = JSON.parse(fs.readFileSync(LISTINGS_FILE, 'utf8'))
  console.log(`Loaded ${listings.length} listings`)

  let allDetails = []
  let queue = [...listings]
  let startIndex = 0

  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
      if (fs.existsSync(OUTPUT_FILE)) {
        allDetails = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
      }
      startIndex = prog.processedCount || 0
      queue = queue.slice(startIndex)
      console.log(`Resuming from index ${startIndex} (have ${allDetails.length} details)`)
    } catch (e) {
      console.log('Progress invalid, starting fresh')
    }
  }

  console.log(`Processing ${queue.length} products with ${CONCURRENT} workers...`)

  const results = [...allDetails]
  const workers = []
  for (let i = 0; i < CONCURRENT; i++) {
    workers.push(worker(queue, results, i))
  }

  // Progress monitor
  const monitor = setInterval(() => {
    const processed = results.length
    const remaining = queue.length
    const total = processed + remaining
    const pct = total > 0 ? ((processed / total) * 100).toFixed(1) : '0.0'
    console.log(`  Progress: ${processed}/${total} (${pct}%)`)
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processedCount: processed }))
  }, 10000)

  await Promise.all(workers)
  clearInterval(monitor)

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2))
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE)

  // Summary
  const catCounts = {}
  results.forEach(r => {
    const cat = r.category_name
    catCounts[cat] = (catCounts[cat] || 0) + 1
  })
  console.log('\n=== Category Distribution ===')
  Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`)
  })
  console.log(`\nDone! ${results.length} product details scraped -> ${OUTPUT_FILE}`)
}

main().catch(console.error)
