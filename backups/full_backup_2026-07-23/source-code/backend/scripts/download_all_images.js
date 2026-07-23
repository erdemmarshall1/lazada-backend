const https = require('https')
const fs = require('fs')
const path = require('path')

const DETAILS_FILE = path.resolve(__dirname, 'scraped_details.json')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'uploads', 'product_images')
const PROGRESS_FILE = path.resolve(__dirname, 'scraped_images_progress.json')
const CONCURRENT = 15

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(false); return }
    const file = fs.createWriteStream(dest)
    https.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode !== 200) {
        file.close()
        fs.unlink(dest, () => {})
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }
      res.pipe(file)
      file.on('finish', () => { file.close(); resolve(true) })
    }).on('error', (err) => {
      file.close()
      fs.unlink(dest, () => {})
      reject(err)
    }).on('timeout', function() { this.destroy(); file.close(); fs.unlink(dest, () => {}); reject(new Error('Timeout')) })
  })
}

function urlToFilename(url, index) {
  const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg'
  const hash = require('crypto').createHash('md5').update(url).digest('hex').substring(0, 12)
  return `${hash}_${index}${ext}`
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function worker(queue, stats, results) {
  while (true) {
    const job = queue.shift()
    if (!job) break
    try {
      const downloaded = await download(job.url, job.dest)
      if (downloaded) stats.downloaded++
      stats.processed++
      results.push({ product_id: job.product_id, url: job.url, local: `/uploads/product_images/${path.basename(job.dest)}` })
    } catch (e) {
      stats.failed++
      stats.processed++
      console.log(`  Failed: ${job.url.substring(0, 80)} -> ${e.message}`)
    }
  }
}

async function main() {
  if (!fs.existsSync(DETAILS_FILE)) {
    console.error(`Details file not found: ${DETAILS_FILE}`)
    return
  }

  const details = JSON.parse(fs.readFileSync(DETAILS_FILE, 'utf8'))
  console.log(`Loaded ${details.length} products for image download`)

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const allJobs = []
  const urlToLocal = {}

  let resumeIndex = 0
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const prog = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
      resumeIndex = prog.processedCount || 0
      console.log(`Resuming from index ${resumeIndex}`)
    } catch (e) {}
  }

  for (let i = 0; i < details.length; i++) {
    const p = details[i]
    const urls = [p.image, ...(p.images || [])].filter(Boolean)
    urls.forEach((url, idx) => {
      const filename = urlToFilename(url, idx)
      const dest = path.join(OUTPUT_DIR, filename)
      allJobs.push({ product_id: p.product_id, url, dest, sortOrder: idx })
      if (!urlToLocal[p.product_id]) urlToLocal[p.product_id] = []
      urlToLocal[p.product_id].push(`/uploads/product_images/${filename}`)
    })
  }

  const totalImages = allJobs.length
  const queue = allJobs.slice(resumeIndex)
  console.log(`Total images: ${totalImages}, remaining: ${queue.length}`)

  const stats = { downloaded: 0, failed: 0, processed: resumeIndex }
  const results = []

  const workers = []
  for (let i = 0; i < CONCURRENT; i++) {
    workers.push(worker(queue, stats, results))
  }

  const monitor = setInterval(() => {
    const pct = totalImages > 0 ? ((stats.processed / totalImages) * 100).toFixed(1) : '0.0'
    console.log(`  Images: ${stats.processed}/${totalImages} (${pct}%) | DL: ${stats.downloaded} | Fail: ${stats.failed}`)
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ processedCount: stats.processed }))
  }, 10000)

  await Promise.all(workers)
  clearInterval(monitor)

  // Build image mapping
  const imageMap = {}
  details.forEach(p => {
    imageMap[p.product_id] = urlToLocal[p.product_id] || []
  })

  const imageMapFile = path.resolve(__dirname, 'scraped_image_map.json')
  fs.writeFileSync(imageMapFile, JSON.stringify(imageMap, null, 2))

  if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE)

  console.log(`\nDone! ${stats.downloaded} new, ${stats.failed} failed`)
  console.log(`Image map saved -> ${imageMapFile}`)
}

main().catch(console.error)
