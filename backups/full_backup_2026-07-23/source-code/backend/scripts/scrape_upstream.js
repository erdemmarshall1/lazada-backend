const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const UPSTREAM_BASE = 'https://d3oobv9weovhej.cloudfront.net';
const PRODUCTS_JSON_PATH = path.join(__dirname, '..', '..', 'products_with_images.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SEEDER_PATH = path.join(__dirname, '..', 'seed', 'seeder.js');

const TOTAL_PRODUCTS = 100;

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const get = (url, timeout = 30000) => new Promise((resolve, reject) => {
  const proto = url.startsWith('https') ? https : http;
  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    timeout,
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://d3oobv9weovhej.cloudfront.net/',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
  const req = proto.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
        return;
      }
      resolve(data);
    });
  });
  req.on('error', reject);
  req.on('timeout', function () { req.destroy(); reject(new Error('Timeout')); });
  req.end();
});

const fetchJSON = async (url) => {
  const text = await get(url);
  return JSON.parse(text);
};

const downloadImage = (url, destPath) => new Promise((resolve) => {
  const proto = url.startsWith('https') ? https : http;
  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    timeout: 30000,
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://d3oobv9weovhej.cloudfront.net/',
    },
  };
  const req = proto.request(options, (res) => {
    if (res.statusCode !== 200) {
      resolve(false);
      return;
    }
    const file = fs.createWriteStream(destPath);
    res.pipe(file);
    file.on('finish', () => { file.close(); resolve(true); });
  });
  req.on('error', () => resolve(false));
  req.on('timeout', function () { req.destroy(); resolve(false); });
  req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function scrape() {
  console.log('=== Scraping products from upstream ===\n');

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const allProducts = [];
  const seenNames = new Set();

  // 1. Fetch hot products
  console.log('[1/4] Fetching hot products...');
  let hotData;
  try {
    hotData = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getHotList`);
    console.log(`  Got ${hotData.list?.length || 0} hot products`);
  } catch (e) {
    console.error(`  Failed: ${e.message}`);
    hotData = { list: [] };
  }

  for (const item of hotData.list || []) {
    if (allProducts.length >= TOTAL_PRODUCTS) break;
    const name = (item.name || '').trim();
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    allProducts.push({
      id: item.id,
      name,
      price: parseFloat(item.price) || 0,
      img: item.img || '',
      sales: item.sales_nums || 0,
      source: 'hot',
    });
  }

  // 2. Fetch recommended products
  console.log('[2/4] Fetching recommended products...');
  let recData;
  try {
    recData = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getSearchList?isRecommended=true&pageSize=${TOTAL_PRODUCTS * 2}`);
    console.log(`  Got ${recData.list?.length || 0} recommended products`);
  } catch (e) {
    console.error(`  Failed: ${e.message}`);
    recData = { list: [] };
  }

  for (const item of recData.list || []) {
    if (allProducts.length >= TOTAL_PRODUCTS) break;
    const name = (item.name || '').trim();
    if (!name || seenNames.has(name)) continue;
    seenNames.add(name);
    allProducts.push({
      id: item.id,
      name,
      price: parseFloat(item.price) || 0,
      img: item.img || '',
      sales: 0,
      source: 'recommended',
    });
  }

  // 3. Fetch additional products if still not enough
  if (allProducts.length < TOTAL_PRODUCTS) {
    console.log('[3/4] Fetching more products (general search)...');
    try {
      const moreData = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getSearchList?pageSize=200`);
      for (const item of moreData.list || []) {
        if (allProducts.length >= TOTAL_PRODUCTS) break;
        const name = (item.name || '').trim();
        if (!name || seenNames.has(name)) continue;
        seenNames.add(name);
        allProducts.push({
          id: item.id,
          name,
          price: parseFloat(item.price) || 0,
          img: item.img || '',
          sales: 0,
          source: 'search',
        });
      }
    } catch (e) {
      console.error(`  Failed: ${e.message}`);
    }
  }

  console.log(`\n  Total unique products scraped: ${allProducts.length}`);

  if (allProducts.length === 0) {
    console.error('No products scraped. Aborting.');
    process.exit(1);
  }

  // 4. Download images
  console.log(`\n[4/4] Downloading ${Math.min(allProducts.length, TOTAL_PRODUCTS)} product images...`);
  const productsOutput = [];
  let downloaded = 0;

  const count = Math.min(allProducts.length, TOTAL_PRODUCTS);
  for (let i = 0; i < count; i++) {
    const p = allProducts[i];
    const ext = 'png';
    const filename = `product_${i}.${ext}`;
    const destPath = path.join(UPLOADS_DIR, filename);

    let imgUrl = p.img;
    if (imgUrl) {
      process.stdout.write(`  [${i + 1}/${count}] ${filename} <- ${imgUrl.slice(0, 60)}... `);
      const ok = await downloadImage(imgUrl, destPath);
      if (ok) {
        downloaded++;
        process.stdout.write('OK\n');
      } else {
        process.stdout.write('FAIL (using placeholder)\n');
      }
      await sleep(100);
    } else {
      process.stdout.write(`  [${i + 1}/${count}] ${filename} <- no image\n`);
    }

    const originalPrice = Math.round(p.price * (1.2 + Math.random() * 0.3) * 100) / 100;

    productsOutput.push({
      Name: p.name,
      Price: p.price,
      OriginalPrice: originalPrice,
      imageFile: `/uploads/${filename}`,
      description: `High quality ${p.name} at great price. Shop now!`,
    });
  }

  // Write products_with_images.json
  console.log(`\nWriting ${productsOutput.length} products to products_with_images.json...`);
  fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(productsOutput, null, 2));

  console.log(`\n=== Done ===`);
  console.log(`  Products scraped: ${productsOutput.length}`);
  console.log(`  Images downloaded: ${downloaded}`);
  console.log(`  Output: products_with_images.json`);
  console.log(`\nNext steps:`);
  console.log(`  1. Run: node scripts/extract_images.js`);
  console.log(`  2. Run: node scripts/generate_seeder.js`);
  console.log(`  3. Run: npm run seed`);
}

scrape().catch((err) => {
  console.error('Scraping failed:', err);
  process.exit(1);
});
