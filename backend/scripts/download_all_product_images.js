/**
 * download_all_product_images.js
 *
 * Downloads ALL 628 product images from the live Railway server and
 * saves them to local_assets/product_images/ with a JSON index database.
 *
 * Run: node scripts/download_all_product_images.js
 */
const https = require('https');
const path = require('path');
const fs = require('fs');

// ---- Configuration ----
const API = 'https://supportive-delight-production-b90c.up.railway.app';
const ASSETS_DIR = path.join(__dirname, '..', '..', 'local_assets', 'product_images');
const INDEX_FILE = path.join(__dirname, '..', '..', 'local_assets', 'product_images_index.json');
const LOG_FILE = path.join(__dirname, '..', '..', 'local_assets', 'download_log.json');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ---- HTTP ----
function req(url, opts) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    opts = opts || {};
    const opt = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'download-all/1.0', ...(opts.headers || {}) },
      timeout: 30000,
    };
    const r = https.request(opt, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks), text: chunks.length > 0 ? Buffer.concat(chunks).toString('utf8') : '' }));
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

function getJson(url, token) {
  return req(url, { headers: token ? { token } : {} }).then(r => {
    try { return JSON.parse(r.text); } catch { return null; }
  });
}

// ---- Login ----
async function login() {
  const r = await req(API + '/main/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
  });
  const j = JSON.parse(r.text);
  if (j.code === 0 && j.data?.token) return j.data.token;
  throw new Error('Login failed: ' + r.text.slice(0, 200));
}

// ---- Fetch all products ----
async function fetchAll(token) {
  const all = [];
  for (let p = 1; p <= 10; p++) {
    const j = await getJson(API + '/main/goods/getSearchList?page=' + p + '&pageSize=100', token);
    if (j?.data?.list) {
      all.push(...j.data.list);
      if (j.data.list.length < 100) break;
    } else break;
  }
  return all;
}

// ---- Download binary ----
function download(url) {
  return req(url).then(r => r.data);
}

// ---- Main ----
async function main() {
  console.log('=== Download All Product Images ===\n');

  // 1. Login
  console.log('1. Logging in...');
  const token = await login();
  console.log('   OK\n');

  // 2. Fetch products
  console.log('2. Fetching all products...');
  const products = await fetchAll(token);
  console.log('   ' + products.length + ' products\n');

  // 3. Download images
  console.log('3. Downloading images...');
  const index = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const imgPath = p.images?.[0] || '';
    if (!imgPath) {
      skipped++;
      continue;
    }

    const urlPath = imgPath.startsWith('/uploads/') ? imgPath : '/uploads/' + imgPath;
    const sourceUrl = API + urlPath;
    const ext = path.extname(urlPath) || '.jpg';
    const filename = p._id + ext;
    const filePath = path.join(ASSETS_DIR, filename);

    // Check if already downloaded
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
      skipped++;
      index.push({
        productId: p._id,
        name: p.name,
        imageFile: filename,
        sourceUrl,
        sizeBytes: fs.statSync(filePath).size,
        status: 'skipped (exists)',
        brand: p.brand || '',
        category: p.categoryName || '',
        description: (p.description || '').substring(0, 200),
      });
      if ((i + 1) % 100 === 0) process.stdout.write('   [' + (i + 1) + '/' + products.length + '] dl:' + succeeded + ' skip:' + skipped + ' fail:' + failed + '\n');
      continue;
    }

    try {
      const data = await download(sourceUrl);
      if (data.length === 0) { failed++; continue; }
      fs.writeFileSync(filePath, data);
      succeeded++;
      index.push({
        productId: p._id,
        name: p.name,
        imageFile: filename,
        sourceUrl,
        sizeBytes: data.length,
        status: 'downloaded',
        brand: p.brand || '',
        category: p.categoryName || '',
        description: (p.description || '').substring(0, 200),
      });
    } catch (e) {
      failed++;
      index.push({
        productId: p._id,
        name: p.name,
        imageFile: filename,
        sourceUrl,
        error: e.message,
        status: 'failed',
      });
    }

    if ((i + 1) % 50 === 0 || i + 1 === products.length) {
      process.stdout.write('   [' + (i + 1) + '/' + products.length + '] dl:' + succeeded + ' skip:' + skipped + ' fail:' + failed + '\n');
    }
  }

  // 4. Save index
  console.log('\n4. Saving index database...');
  const db = {
    generatedAt: new Date().toISOString(),
    totalProducts: products.length,
    downloaded: succeeded,
    skipped, failed,
    baseUrl: API,
    assetFolder: 'local_assets/product_images/',
    products: index,
  };
  fs.writeFileSync(INDEX_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log('   Saved to ' + INDEX_FILE);

  // Also save a summary log
  const summary = { succeeded, skipped, failed, total: products.length, timestamp: db.generatedAt };
  fs.writeFileSync(LOG_FILE, JSON.stringify(summary, null, 2), 'utf8');

  // 5. Report
  console.log('\n=== Results ===');
  console.log('Total products: ' + products.length);
  console.log('Downloaded: ' + succeeded);
  console.log('Skipped (already exist): ' + skipped);
  console.log('Failed: ' + failed);
  const totalSize = (index.reduce((s, e) => s + (e.sizeBytes || 0), 0) / 1048576).toFixed(1);
  console.log('Total size: ' + totalSize + ' MB');
  console.log('Images in: ' + ASSETS_DIR);
  console.log('Index at: ' + INDEX_FILE);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
