const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHECKPOINT_FILE = path.join(__dirname, 'bing_checkpoint.json');
const PER_PAGE = 100;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const getJSON = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error(`Parse error`)); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const mod = url.startsWith('https') ? https : http;
  const headers = { 'Content-Type': 'application/json', 'Content-Length': json.length };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const req = mod.request(url, { method: 'POST', headers, timeout: 30000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  });
  req.on('error', reject);
  req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  req.write(json);
  req.end();
});

async function getFirstImage(page, productName) {
  const queries = [productName];
  const words = productName.split(' ');
  if (words.length > 5) queries.push(words.slice(0, 5).join(' '));
  if (words.length > 3) queries.push(words.slice(0, 3).join(' '));

  for (const query of [...new Set(queries)]) {
    try {
      await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await sleep(1500);

      const imgSrc = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.src;
          if (src && src.includes('/th/id/OIP.') && img.naturalWidth >= 100) {
            return src.replace(/[?&]w=\d+/, '?w=600').replace(/&h=\d+/, '&h=600');
          }
        }
        return null;
      });

      if (imgSrc) return imgSrc;
    } catch(e) {
      // If page load fails (timeout), try next query
    }
  }
  return null;
}

async function main() {
  console.log('=== Bing Image Scraper (direct URL mode) ===\n');

  // 1. Login
  console.log('Logging in...');
  const loginResult = await postJSON(`${API}/main/sendMsg/login`, {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginResult?.data?.token;
  if (!token) {
    console.error('Login failed:', JSON.stringify(loginResult));
    return;
  }
  console.log('Login OK\n');

  // 2. Load all products
  console.log('Loading products...');
  let allProducts = [];
  let page = 1;
  let total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(`${API}/main/goods/getSearchList?page=${page}&pageSize=${PER_PAGE}`);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    console.log(`  Loaded ${allProducts.length}/${total}`);
    if (list.length < PER_PAGE) break;
    page++;
    await sleep(200);
  }

  const pixabayProducts = allProducts.filter(p => (p.images?.[0] || '').includes('pixabay.com'));
  console.log(`\nProducts needing real images: ${pixabayProducts.length}`);

  // 3. Checkpoint
  let checkpoint = [];
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try { checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch(e) {}
    console.log(`Checkpoint: ${checkpoint.length} processed`);
  }
  const processedIds = new Set(checkpoint.map(c => c._id));
  const remaining = pixabayProducts.filter(p => !processedIds.has(p._id));
  console.log(`Remaining: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('All done!');
    return;
  }

  // 4. Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', '--disable-web-security',
      '--window-size=1280,720', '--disable-blink-features=AutomationControlled',
    ],
    defaultViewport: { width: 1280, height: 720 },
  });

  const bingPage = await browser.newPage();
  await bingPage.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  let succeeded = 0, failed = 0, skipped = 0, batch = [];

  for (let i = 0; i < remaining.length; i++) {
    const product = remaining[i];
    const name = product.name || product.title || 'Unknown';
    const productId = product._id;

    console.log(`[${i+1}/${remaining.length}] ${name.substring(0, 55)}...`);

    try {
      const imgUrl = await getFirstImage(bingPage, name);

      if (!imgUrl) {
        console.log(`  -> NO MATCH`);
        skipped++;
        checkpoint.push({ _id: productId, status: 'skipped' });
      } else {
        batch.push({ productId, images: [imgUrl] });
        checkpoint.push({ _id: productId, status: 'ok', image: imgUrl });
        succeeded++;
        console.log(`  -> OK: ${imgUrl.substring(0, 70)}`);
      }
    } catch (err) {
      console.log(`  -> ERROR: ${err.message}`);
      failed++;
      checkpoint.push({ _id: productId, status: 'error', error: err.message });
    }

    // Batch update every 10 products
    if (batch.length >= 10) {
      console.log(`  Batch updating ${batch.length} products...`);
      try {
        const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
        console.log(`  -> ${result?.msg || 'OK'}`);
      } catch (err) {
        console.log(`  -> Batch update FAILED: ${err.message}`);
      }
      batch = [];
    }

    // Checkpoint every 15 products
    if ((i + 1) % 15 === 0 || i === 0) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint));
      console.log(`\n  === CP: ${i+1}/${remaining.length} OK:${succeeded} Fail:${failed} Skip:${skipped} ===\n`);
    }

    await sleep(500 + Math.random() * 1000);
  }

  // Final batch
  if (batch.length > 0) {
    console.log(`Final batch updating ${batch.length} products...`);
    try {
      const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
      console.log(`  -> ${result?.msg || 'OK'}`);
    } catch (err) {
      console.log(`  -> Final batch update FAILED: ${err.message}`);
    }
  }

  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint));

  console.log(`\n=== DONE ===`);
  console.log(`Total: ${remaining.length} | OK: ${succeeded} | Failed: ${failed} | Skipped: ${skipped}`);

  await browser.close();
}

main().catch(console.error);
