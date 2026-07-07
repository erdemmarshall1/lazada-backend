/**
 * scrape_product_images.js
 *
 * Fetches all products from the Railway API, searches Pixabay for matching
 * product images, and generates a JSON mapping file ready for batch import
 * via the admin endpoint POST /home/admin/batch-update-images.
 *
 * Usage:
 *   node scripts/scrape_product_images.js
 *
 * Saves progress every 100 products. Re-run to resume from last checkpoint.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ─── Config ───────────────────────────────────────────────────────────────────
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const RAILWAY_API = 'https://lazada-backend-production-3b57.up.railway.app';
const PIXABAY_API = 'https://pixabay.com/api';
const OUTPUT_FILE = path.join(__dirname, '..', 'product_image_updates.json');
const CHECKPOINT_FILE = path.join(__dirname, '..', 'product_image_progress.json');
const PER_PAGE = 100;
const DELAY_MS = 500;
const MAX_RETRIES = 2;
const SAVE_EVERY = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getJSON = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`JSON parse failed: ${data.slice(0,200)}`)); }
    });
  }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const fetchAllProducts = async () => {
  let all = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total) {
    const url = `${RAILWAY_API}/main/goods/getSearchList?page=${page}&pageSize=${PER_PAGE}`;
    console.log(`  Fetching products page ${page}...`);
    const data = await getJSON(url);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    console.log(`  Got ${list.length} products (total: ${total})`);
    if (list.length < PER_PAGE) break;
    page++;
    await sleep(300);
  }
  return all;
};

const searchPixabay = async (query, retry = 0) => {
  try {
    const q = encodeURIComponent(query.slice(0, 100));
    const url = `${PIXABAY_API}/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&safesearch=true&per_page=3`;
    const data = await getJSON(url);
    if (data.totalHits > 0 && data.hits?.length > 0) {
      const hit = data.hits[0];
      return hit.webformatURL || hit.largeImageURL || hit.previewURL || null;
    }
    return null;
  } catch (err) {
    if (retry < MAX_RETRIES) {
      await sleep(2000);
      return searchPixabay(query, retry + 1);
    }
    console.error(`    Pixabay error for "${query.slice(0,50)}": ${err.message}`);
    return null;
  }
};

const cleanProductName = (name) => {
  return name
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim()
    .slice(0, 100);
};

const saveCheckpoint = (updates, processedCount, totalCount) => {
  const checkpoint = { updates, processedCount, totalCount, timestamp: new Date().toISOString() };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
  console.log(`  [CHECKPOINT] Saved ${updates.length} updates (${processedCount}/${totalCount} processed)`);
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log('═'.repeat(50));
  console.log('Product Image Scraper (with resume support)');
  console.log('═'.repeat(50));
  console.log(`Pixabay key: ${PIXABAY_KEY.slice(0,8)}...`);
  console.log(`Railway API: ${RAILWAY_API}`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Checkpoint file: ${CHECKPOINT_FILE}`);
  console.log('');

  // Step 1: Fetch all products from Railway
  console.log('Step 1: Fetching all products from Railway...');
  let products;
  try {
    products = await fetchAllProducts();
    console.log(`  Total products fetched: ${products.length}`);
  } catch (err) {
    console.error(`  FATAL: Could not fetch products: ${err.message}`);
    process.exit(1);
  }

  if (products.length === 0) {
    console.log('  No products found. Exiting.');
    process.exit(0);
  }

  // Only process products that need images (no images or remote CDN images)
  const needsImages = products.filter(p => {
    const img = p.images?.[0] || p.image || p.img
    if (!img) return true
    if (typeof img === 'string' && (img.includes('popularity1.shop') || img.includes('s3.amazonaws.com') || img.startsWith('http'))) return true
    return false
  })
  console.log(`  Products needing images: ${needsImages.length} / ${products.length} total`)
  console.log(`  Skipping ${products.length - needsImages.length} products that already have local images`)

  // Step 2: Load checkpoint if exists
  let updates = [];
  let startIndex = 0;
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try {
      const cp = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      if (cp.totalCount === needsImages.length) {
        updates = cp.updates || [];
        startIndex = cp.processedCount || 0;
        console.log(`  Resuming from product ${startIndex + 1}/${needsImages.length} (${updates.length} already found)`);
      } else {
        console.log(`  Total count changed (${cp.totalCount} -> ${needsImages.length}), starting fresh`);
        if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);
      }
    } catch (e) {
      console.log(`  Corrupted checkpoint, starting fresh`);
    }
  }

  // Step 3: Search Pixabay for each product
  console.log('\nStep 3: Searching Pixabay for product images...');
  let found = updates.length;
  let skipped = 0;

  for (let i = startIndex; i < needsImages.length; i++) {
    const p = needsImages[i];
    const name = cleanProductName(p.name || '');
    if (!name) {
      console.log(`  [${i + 1}/${needsImages.length}] SKIP — no name (id: ${p._id})`);
      skipped++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${needsImages.length}] "${name.slice(0, 40)}..." → `);

    const imgUrl = await searchPixabay(name);

    if (imgUrl) {
      updates.push({
        productId: p._id,
        images: [imgUrl],
        name: p.name,
        shopId: p.shopId || null,
      });
      found++;
      console.log(`OK (${imgUrl.slice(0, 60)}...)`);
    } else {
      // Try shorter query (last 2-3 words)
      const words = name.split(' ');
      let fallbackUrl = null;
      if (words.length > 3) {
        const short = words.slice(-3).join(' ');
        console.log(`no match, trying shorter "${short}"...`);
        fallbackUrl = await searchPixabay(short);
      }
      if (fallbackUrl) {
        updates.push({
          productId: p._id,
          images: [fallbackUrl],
          name: p.name,
          shopId: p.shopId || null,
        });
        found++;
        console.log(`  OK (fallback: ${fallbackUrl.slice(0, 60)}...)`);
      } else {
        skipped++;
        console.log('NO MATCH');
      }
    }

    if ((i + 1) % SAVE_EVERY === 0) {
      saveCheckpoint(updates, i + 1, needsImages.length);
    }

    if (i < needsImages.length - 1) await sleep(DELAY_MS);
  }

  // Step 4: Write output file
  console.log('\nStep 4: Writing output file...');
  const result = {
    total: needsImages.length,
    found,
    skipped,
    generatedAt: new Date().toISOString(),
    source: RAILWAY_API,
    updates,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
  console.log(`  Written to: ${OUTPUT_FILE}`);
  console.log(`  Products: ${needsImages.length} needed images, ${found} matched, ${skipped} skipped`);
  console.log('');

  // Clean up checkpoint
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE);

  // Print summary
  console.log('═'.repeat(50));
  console.log('SUMMARY');
  console.log('═'.repeat(50));
  console.log(`Total products on Railway: ${products.length}`);
  console.log(`Products needing images:   ${needsImages.length}`);
  console.log(`Images found via Pixabay:  ${found}`);
  console.log(`No match / skipped:        ${skipped}`);
  console.log('');
  console.log('Next steps:');
  console.log(`  1. Review ${OUTPUT_FILE} if desired`);
  console.log(`  2. Run: node scripts/apply_image_updates.js admin123`);
  console.log('');

  if (found === 0) {
    console.log('WARNING: No images were found! Possible causes:');
    console.log('  - Pixabay API key may be invalid');
    console.log('  - Railway API may not be returning product names');
  }
};

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
