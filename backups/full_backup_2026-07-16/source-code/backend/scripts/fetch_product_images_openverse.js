/**
 * fetch_product_images_openverse.js
 *
 * Fetches real product images using the Openverse API (free, no API key needed).
 * Replaces Pixabay stock photos with actual product images from Flickr/Wikimedia/etc.
 *
 * Processes products, downloads images, uploads to Railway, and batch-updates.
 *
 * Usage:
 *   node scripts/fetch_product_images_openverse.js
 *
 * Saves progress every 20 products. Re-run to resume from checkpoint.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const API = 'https://lazada-backend-production-3b57.up.railway.app';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const PER_PAGE = 100;
const OUTPUT_FILE = path.join(__dirname, '..', 'product_image_real_updates.json');
const CHECKPOINT_FILE = path.join(__dirname, '..', 'openverse_progress.json');
const OPENVERSE_API = 'https://api.openverse.org/v1/images/';
const DELAY_MS = 600;
const BATCH_SIZE = 20;
const MAX_PRODUCTS = 2000;        // max per run

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const getJSON = (url, timeout = 30000) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`JSON: ${data.slice(0,100)}`)); }
    });
  }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const mod = url.startsWith('https') ? https : http;
  const opts = {
    hostname: u.hostname,
    port: u.port || 443,
    path: u.pathname + (u.search || ''),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'fetch-script/1.0',
    },
    timeout: 60000,
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const req = mod.request(opts, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Bad JSON: ${data.slice(0,100)}`)); }
    });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const downloadImage = (url) => new Promise((resolve) => {
  const mod = url.startsWith('https') ? https : http;
  const chunks = [];
  mod.get(url, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 400) return resolve(null);
    const ct = res.headers['content-type'] || '';
    if (!ct.startsWith('image/')) return resolve(null);
    res.on('data', c => chunks.push(c));
    res.on('end', () => resolve(Buffer.concat(chunks)));
  }).on('error', () => resolve(null)).on('timeout', function () { this.destroy(); resolve(null); });
});

const cleanQuery = (name) => {
  return name
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
};

const searchOpenverse = async (query, retry = 0) => {
  try {
    const q = encodeURIComponent(query);
    const url = `${OPENVERSE_API}?q=${q}&page_size=5&license=cc0&license=cc-by&license=cc-by-sa`;
    const data = await getJSON(url, 15000);
    if (data.results?.length > 0) {
      // Find the first result with a valid image URL that ends with common image extensions
      for (const result of data.results) {
        if (result.url && (result.url.endsWith('.jpg') || result.url.endsWith('.jpeg') || result.url.endsWith('.png') || result.url.endsWith('.webp'))) {
          return result.url;
        }
        if (result.url) return result.url; // fallback to any URL
      }
      return data.results[0].url;
    }
    return null;
  } catch (err) {
    if (retry < 2) {
      await sleep(2000);
      return searchOpenverse(query, retry + 1);
    }
    return null;
  }
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log('='.repeat(60));
  console.log('REAL PRODUCT IMAGE FETCHER (Openverse API)');
  console.log('='.repeat(60));

  // Step 1: Login
  console.log('\n[1] Logging in...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: ADMIN_USER, password: ADMIN_PASS });
  if (loginRes.code !== 0 || !loginRes.data?.token) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('  OK');

  // Step 2: Fetch all products
  console.log('\n[2] Fetching products...');
  let allProducts = [];
  let page = 1;
  let total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(`${API}/main/goods/getSearchList?page=${page}&pageSize=${PER_PAGE}`);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    if (list.length < PER_PAGE) break;
    page++;
    await sleep(200);
  }
  console.log(`  Total: ${allProducts.length}`);

  // Products with Pixabay images (need replacement) OR no images
  const needsRealImage = allProducts.filter(p => {
    const img = p.images?.[0] || '';
    return !img || img.includes('pixabay.com') || img.includes('popularity1.shop');
  });
  console.log(`  Need real images: ${needsRealImage.length}`);

  if (needsRealImage.length === 0) {
    console.log('  Nothing to do!');
    return;
  }

  // Step 3: Load checkpoint
  let updates = [];
  let found = 0;
  let skipped = 0;
  let startIdx = 0;

  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      if (cp.totalCount === needsRealImage.length) {
        startIdx = cp.processedCount || 0;
        updates = cp.updates || [];
        found = cp.found || 0;
        skipped = cp.skipped || 0;
        console.log(`  Resuming from ${startIdx + 1}/${needsRealImage.length}`);
      }
    } catch (e) {}
  }

  const targetEnd = Math.min(startIdx + MAX_PRODUCTS, needsRealImage.length);
  console.log(`  Processing ${startIdx + 1} to ${targetEnd} of ${needsRealImage.length}`);

  // Step 4: Process each product
  console.log('\n[3] Searching Openverse for real product images...');

  for (let i = startIdx; i < targetEnd; i++) {
    const p = needsRealImage[i];
    const name = cleanQuery(p.name || '').substring(0, 80);
    if (!name) {
      skipped++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${targetEnd}] "${name.substring(0, 40)}..." `);

    // Try full name first, then shorter if needed
    let imgUrl = await searchOpenverse(name);
    if (!imgUrl && name.length > 40) {
      const short = name.substring(0, 40);
      console.log(`\n  trying shorter "${short}"...`);
      imgUrl = await searchOpenverse(short);
    }

    if (imgUrl) {
      // Try to download the image to verify it works
      const buf = await downloadImage(imgUrl);
      if (buf && buf.length > 1000) {
        updates.push({
          productId: p._id,
          images: [imgUrl],
          name: p.name,
          shopId: p.shopId || null,
        });
        found++;
        console.log(`OK (${imgUrl.substring(0, 60)}...) ${buf.length} bytes`);
      } else {
        // Still add it - URL might work even if download failed
        updates.push({
          productId: p._id,
          images: [imgUrl],
          name: p.name,
          shopId: p.shopId || null,
        });
        found++;
        console.log(`OK (${imgUrl.substring(0, 60)}...) [unverified]`);
      }
    } else {
      skipped++;
      console.log('NO MATCH');
    }

    if ((i + 1) % BATCH_SIZE === 0) {
      saveCheckpoint(updates, found, skipped, i + 1, needsRealImage.length);
    }

    if (i < targetEnd - 1) await sleep(DELAY_MS);
  }

  // Step 5: Save and apply
  console.log('\n[4] Saving mapping file...');
  const result = {
    totalNeeded: needsRealImage.length,
    found,
    skipped,
    generatedAt: new Date().toISOString(),
    updates,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`  Written to: ${OUTPUT_FILE}`);

  console.log('\n[5] Applying batch update to Railway API...');
  const applyRes = await postJSON(`${API}/home/admin/batch-update-images`, { updates }, token);
  console.log(`  Result: ${JSON.stringify(applyRes)}`);

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) {
    if (targetEnd >= needsRealImage.length) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Products needing images: ${needsRealImage.length}`);
  console.log(`  Images found:            ${found}`);
  console.log(`  Skipped / no match:      ${skipped}`);
  console.log(`  Batch update applied:    ${applyRes.code === 0 ? 'OK' : 'FAILED'}`);
  if (targetEnd < needsRealImage.length) {
    console.log(`\n  Remaining: ${needsRealImage.length - targetEnd}`);
    console.log(`  Re-run to continue: node scripts/fetch_product_images_openverse.js`);
  }
};

function saveCheckpoint(updates, found, skipped, processedCount, totalCount) {
  const cp = { updates, found, skipped, processedCount, totalCount, timestamp: new Date().toISOString() };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
  console.log(`    [CP] ${processedCount}/${totalCount}, ${found} found, ${skipped} skipped`);
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
