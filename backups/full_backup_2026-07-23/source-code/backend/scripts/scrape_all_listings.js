const https = require('https')
const fs = require('fs')
const path = require('path')

const API_BASE = 'https://api.popularity1.shop'
const OUTPUT_FILE = path.resolve(__dirname, 'scraped_listings.json')
const PROGRESS_FILE = path.resolve(__dirname, 'scraped_listings_progress.json')
const PAGE_SIZE = 500
const TOTAL_KNOWN = 26399

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

async function fetchPage(page) {
  const url = `${API_BASE}/api/index/product?page=${page}&limit=${PAGE_SIZE}`
  const resp = await get(url)
  if (resp.code !== 1 || !resp.data || !resp.data.list) {
    console.log(`  Page ${page}: invalid response, code=${resp.code}`)
    return []
  }
  console.log(`  Page ${page}: ${resp.data.list.length} products`)
  return resp.data.list.map(p => ({
    id: p.id,
    mer_id: p.mer_id,
    product_id: p.product_id,
    sales: p.sales,
    click: p.click,
    title: p.goods.title,
    image: p.goods.image,
    sales_price: p.goods.sales_price,
    market_price: p.goods.market_price,
    cost_price: p.goods.cost_price
  }))
}

async function main() {
  let allProducts = []
  let startPage = 1

  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
      startPage = prog.lastPage + 1
      if (fs.existsSync(OUTPUT_FILE)) {
        allProducts = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'))
      }
      console.log(`Resuming from page ${startPage} (have ${allProducts.length})`)
    } catch (e) {
      console.log('Progress invalid, starting fresh')
    }
  }

  const totalPages = Math.ceil(TOTAL_KNOWN / PAGE_SIZE)
  console.log(`Pages to fetch: ~${totalPages}`)

  for (let page = startPage; page <= totalPages; page++) {
    try {
      const products = await fetchPage(page)
      allProducts.push(...products)
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allProducts, null, 2))
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ lastPage: page, totalFetched: allProducts.length }))
      console.log(`  Total: ${allProducts.length}`)
    } catch (e) {
      console.log(`  Page ${page} failed: ${e.message}. Retrying...`)
      await sleep(5000)
      page--
      continue
    }
    await sleep(200)
  }

  console.log(`\nDone! ${allProducts.length} products scraped -> ${OUTPUT_FILE}`)
  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE)
}

main().catch(console.error)
