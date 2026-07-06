const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const BASE_DIR = path.resolve(__dirname, '..', 'uploads')
const BANNER_DIR = path.join(BASE_DIR, 'banners')
const CATEGORY_DIR = path.join(BASE_DIR, 'category')
const PRODUCT_DIR = path.join(BASE_DIR, 'product_images')
const MERCHANT_DIR = path.join(BASE_DIR, 'merchant')
const MERCHANT_PRODUCT_DIR = path.join(BASE_DIR, 'merchant_products')

const dirs = [BANNER_DIR, CATEGORY_DIR, PRODUCT_DIR, MERCHANT_DIR, MERCHANT_PRODUCT_DIR]
dirs.forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) })

function getExt(url) {
  const clean = url.split('?')[0].split('#')[0]
  const ext = path.extname(clean).toLowerCase()
  if (ext) return ext
  const match = clean.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(?:\?|$)/i)
  return match ? '.' + match[1].toLowerCase() : '.jpg'
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log(`  [SKIP] Already exists: ${path.basename(dest)}`)
      return resolve({ url, dest, skipped: true })
    }
    const client = url.startsWith('https') ? https : http
    client.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const file = fs.createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => {
        file.close()
        const stats = fs.statSync(dest)
        if (stats.size === 0) {
          fs.unlinkSync(dest)
          reject(new Error(`Empty file: ${url}`))
        } else {
          console.log(`  [OK] ${path.basename(dest)} (${(stats.size / 1024).toFixed(1)} KB)`)
          resolve({ url, dest })
        }
      })
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('Timeout')) })
  })
}

function downloadBatch(items, label, concurrency = 5) {
  console.log(`\n=== Downloading ${label} (${items.length} items) ===`)
  let index = 0
  const results = []
  function next() {
    if (index >= items.length) return Promise.resolve(results)
    const current = index++
    const { url, dest } = items[current]
    const destDir = path.dirname(dest)
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
    return downloadFile(url, dest)
      .then(r => { results.push(r) })
      .catch(err => {
        console.log(`  [FAIL] ${path.basename(dest)}: ${err.message}`)
        results.push({ url, dest, error: err.message })
      })
      .then(() => next())
  }
  const workers = Array(Math.min(concurrency, items.length)).fill(null).map(() => next())
  return Promise.all(workers).then(() => results)
}

async function main() {
  // === BANNERS ===
  const bannerUrls = [
    'https://s3.popularity1.shop/tikiproduct/uploads/20260528/e85363d7cf4d0cad955fbb57b8cdae2f.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260528/af8ad62af58555e0d6f6448cfbc383c9.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260528/4bcec1cb8c282dff693aa4b8f8a8b6da.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260528/c43b3ffaf9feb3153932f8dbf925839b.jpg',
  ]
  const bannerItems = bannerUrls.map((url, i) => ({
    url, dest: path.join(BANNER_DIR, `banner_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(bannerItems, 'Banners')

  // === CATEGORY ICONS ===
  const categoryUrls = [
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/892bbc80f7f9cb73915199763ef6bb16.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/f04eb5b74e15aa12e9d28f1d3b8e7c44.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/195e9e0bf92e10cbb8bdbbc309b34955.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/b8c405775b78bfd7311796c0182f5462.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/a4171d17b0ff52cd937accd7d9606dc4.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/b068dc999a975c830d27e008e6222971.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/f2fb2861a8910fa11256d4a7afc3e9cf.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/d95570f90577abb1f9c6fc2a3d92ee6c.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/4e32a3d3008b5ff48d6f644f556ac468.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/f4c97315f0bf1ca5acb44ceb5bea752d.png',
    'https://s3.popularity1.shop/tikiproduct/uploads/20250515/3511eeaabc42f77e4c61a45a4fc8fa0a.png',
  ]
  const categoryNames = [
    'Lifestyle', 'Men_Shoes', 'Women_Shoes', 'Accessories',
    'Men_Clothing', 'Women_Bags', 'Men_Bags', 'Women_Clothing',
    'Girls', 'Boys', 'Global_Purchase'
  ]
  const catItems = categoryUrls.map((url, i) => ({
    url, dest: path.join(CATEGORY_DIR, `${categoryNames[i]}${getExt(url)}`)
  }))
  await downloadBatch(catItems, 'Category Icons')

  // === HOT PRODUCTS (women-bags) ===
  const hotProductUrls = [
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/cb5b085803ee068e68b648e8566f9132.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/7a7834988fd1ed8f57535387a3c8f8e1.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/9b73c85bf743ccf2bcc41f7b9d4b6c66.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/63643de35b1dae22567b302ee502cd2a.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d5347c08930ce57700abe5ab97f7f0ae.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/fe45c51aef0bc98b018b115e16b9e896.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/78d45192b7c69df7d60dd73ceeb9ffc7.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/5dd4f594cd02603f383e6f0883f9f390.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/3764d60300236f65fc3dcab9a397459b.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/3d3fca6c6042dc9725ce946df7897fc8.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/794d23e5265294c26072e9484e538f1b.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/4d21a6e24dc21f3bd5b4b5b8875e73e9.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/4ea6622d7e887e8a40c0bef45a53a9b1.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/9109092f2cd9f6b905734e19bf53f845.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/90b5af6ce71601a254e73a9b481857f4.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/1222a040cf8af7c1c0e77cb3759fd099.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d3b5d1fb2e95a15985e63b1559e1a6a3.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d355394eb9fe4e96eb432f12e5995d6f.jpg',
  ]
  const hotItems = hotProductUrls.map((url, i) => ({
    url, dest: path.join(PRODUCT_DIR, `hot_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(hotItems, 'Hot Products (women-bags)')

  // === FIND PRODUCTS (mixed) ===
  const findProductUrls = [
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/9defde99b61b45181974f3017f6062de.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260130/42d4008fd30c55448b3c83a97a3eea72.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/b8f1fba95d281c243caf05dc004eed8f.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260128/dff286fa14ac7d26ccb1a50980c3ca5b.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260203/255c2a7a650c7e0976a529df9b73824b.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/c85e389c4b511e4ea123e3bd1945a45e.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/a5dd11f81ddabd89d0c4d58411fb63c6.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/31995010f1681f1ceeae9c47eeb16864.jpg',
    'https://s3.popularity1.shop/tikiproduct/product/65b727b5b22c6/990-990/rh01914eu-38-cm-pearlised-baking-tray-non-stick-baking-sheet-carbon-steel-bpapfoa-free-silicone-handles-strong-durable-kitchen-cookware-for.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260131/ca13818c525ad0112cfd76e4d444e4a9.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/49c8d9fd02de134e27fea205529fcdb7.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Bags/7e0d8d87d5a7a75b99c6f659d1c9d7c2.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260128/6715255a30b362f55c2808d2ba150758.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260131/e754c0379681e4bb80354d848ba8124e.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260128/e43e8ff0180a85e0831030a9350770eb.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/175d53ed17d053ef9c23db1ec0306e98.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260201/dff23770e6a1631c8f078aa02cbf619f.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/men-Bags/a9bd25b86be0c22c91e6d7779162fb37.jpg',
    'https://s3.popularity1.shop/tikiproduct/product/65b824df63d54/990-990/iphone-15-128gb.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/cd9aba03329969a2f4811a6cc6da6856.jpg',
  ]
  const findItems = findProductUrls.map((url, i) => ({
    url, dest: path.join(PRODUCT_DIR, `find_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(findItems, 'Find Products (mixed)')

  // === MERCHANT AVATARS ===
  const merchantUrls = [
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/712e0a2b239f13608ad0678be0336d4e.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/644071227bdb78253c24f6a3836708da.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/c318603168ee6c090ce90e03c772a03a.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/b62f1aeb3a2ff5977d5dbc59da4a3c6b.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/753fbd9557ec67f7bfd0b040f2fb32d0.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/1a0be269d8de5e2d1812dedabd1b890a.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/25d990944a4127db429c499abc5d52c8.webp',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260116/de3586e9495676f6dfc9002b546b7762.webp',
  ]
  const merchantNames = [
    'VELORA', 'SERAVYN', 'MAISON_VELLE', 'NORVIA',
    'SAVVY_DEALS', 'Zion_Store', 'Golden_Harvest', 'Route_66_Store'
  ]
  const merchItems = merchantUrls.map((url, i) => ({
    url, dest: path.join(MERCHANT_DIR, `${merchantNames[i]}${getExt(url)}`)
  }))
  await downloadBatch(merchItems, 'Merchant Avatars')

  // === MERCHANT PRODUCT IMAGES ===
  const merchProdUrls = [
    'https://s3.outnetsource.top/tikiproduct/uploads/20260205/dda90c18b7c78af00574e6cea867375c.jpg',
    'https://s3.outnetsource.top/tikiproduct/uploads/20260205/e9ced1b2fa875cca62028d9a3b0b79e8.jpg',
    'https://s3.outnetsource.top/tikiproduct/static/men-Accessories/1624682800597-5AtqFF7suAJXKfLYD.jpg',
    'https://s3.outnetsource.top/tikiproduct/uploads/20260202/6bbf820c938fb594333128c35f34b373.jpg',
    'https://s3.outnetsource.top/tikiproduct/uploads/20260205/56a3d0827e16310baeedb53c336191e6.jpg',
    'https://s3.outnetsource.top/tikiproduct/uploads/20260204/afd793c3117653a9a0ac422b2d79c16f.jpg',
  ]
  const merchProdItems = merchProdUrls.map((url, i) => ({
    url, dest: path.join(MERCHANT_PRODUCT_DIR, `merchant_prod_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(merchProdItems, 'Merchant Product Images')

  // === STATIC WOMEN-ACCESSORIES ===
  const womenAccUrls = [
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/cd9aba03329969a2f4811a6cc6da6856.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/c85e389c4b511e4ea123e3bd1945a45e.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/a5dd11f81ddabd89d0c4d58411fb63c6.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/9defde99b61b45181974f3017f6062de.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/175d53ed17d053ef9c23db1ec0306e98.jpg',
  ]
  const womenAccItems = womenAccUrls.map((url, i) => ({
    url, dest: path.join(PRODUCT_DIR, `women_acc_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(womenAccItems, 'Static Women Accessories')

  // === STATIC MEN-ACCESSORIES ===
  const menAccUrls = [
    'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/49c8d9fd02de134e27fea205529fcdb7.jpg',
    'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/31995010f1681f1ceeae9c47eeb16864.jpg',
  ]
  const menAccItems = menAccUrls.map((url, i) => ({
    url, dest: path.join(PRODUCT_DIR, `men_acc_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(menAccItems, 'Static Men Accessories')

  // === STATIC MEN-BAGS ===
  const menBagItems = [{
    url: 'https://s3.popularity1.shop/tikiproduct/static/men-Bags/a9bd25b86be0c22c91e6d7779162fb37.jpg',
    dest: path.join(PRODUCT_DIR, 'men_bags_1.jpg')
  }]
  await downloadBatch(menBagItems, 'Static Men Bags')

  // === REMAINING UPLOAD PRODUCTS ===
  const uploadUrls = [
    'https://s3.popularity1.shop/tikiproduct/uploads/20260131/e754c0379681e4bb80354d848ba8124e.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260131/ca13818c525ad0112cfd76e4d444e4a9.jpg',
    'https://s3.popularity1.shop/tikiproduct/product/65b824df63d54/990-990/iphone-15-128gb.jpg',
    'https://s3.popularity1.shop/tikiproduct/uploads/20260130/42d4008fd30c55448b3c83a97a3eea72.jpg',
  ]
  const uploadItems = uploadUrls.map((url, i) => ({
    url, dest: path.join(PRODUCT_DIR, `upload_${i + 1}${getExt(url)}`)
  }))
  await downloadBatch(uploadItems, 'Upload Products')

  console.log('\n=== DOWNLOAD COMPLETE ===')
  process.exit(0)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
