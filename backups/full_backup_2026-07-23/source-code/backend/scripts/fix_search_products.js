const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHECKPOINT_FILE = path.join(__dirname, 'fix_search_checkpoint.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url, token) => new Promise((resolve, reject) => {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = { timeout: 15000 };
  if (token) opts.headers = headers;
  https.get(url, opts, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});
const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 30000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  });
  req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  req.write(json); req.end();
});

// Target product IDs from fix.txt (unique)
const TARGET_IDS = [
  '6a4b5d13507b0208132b5e96', '6a4b5d13507b0208132b5d3c', '6a4b5d13507b0208132b4b77',
  '6a4b5d12507b0208132b2676', '6a4b5d11507b0208132b2243', '6a4b5d11507b0208132b1f73',
  '6a4b5d11507b0208132b1f89', '6a4b5d11507b0208132b1ebe', '6a4b5d11507b0208132b1dfd',
  '6a4b5d11507b0208132b1dff', '6a4b5d11507b0208132b1dfb', '6a4b5d11507b0208132b1e09',
  '6a4b5d11507b0208132b1c9e', '6a4b5d11507b0208132b1c8a', '6a4b5d11507b0208132b1b76',
  '6a4b5d11507b0208132b1b92', '6a4b5d11507b0208132b1646', '6a4b5d11507b0208132b1177',
  '6a4b5d11507b0208132b0f89', '6a4b5d11507b0208132b0de3', '6a4b5d11507b0208132b0de1',
  '6a4b5d11507b0208132b0c23', '6a4b5d11507b0208132b092f', '6a4b5d11507b0208132b0931',
  '6a4b5d11507b0208132b092b', '6a4b5d11507b0208132b0933', '6a4b5d11507b0208132b0836',
  '6a4b5d10507b0208132b06ce', '6a4b5d10507b0208132b0627', '6a4b5d10507b0208132b0613',
];

function buildQueries(name) {
  if (!name) return [];
  let n = name;
  n = n.replace(/\([^)]*\)/g, '').trim();
  n = n.replace(/\d+[\s]*[.×xX]?[\s]*\d*[\s]*(?:oz|ml|fl oz|ounce|pound|lb|count|pack|set|kit|bundle|pcs|pieces|capsules|tablets|servings|g|mg|kg|fl|qt|inch|cm|mm)/gi, '');
  n = n.replace(/\b\d+[\s]*(?:oz|ml|fl|count|pack|set|oz\.?|ml\.?|fl\.?|lbs?|in|cm|mm|g|mg|kg)\b/gi, '');
  n = n.replace(/\b(Women'?s?|Men'?s?|for Women|for Men|Unisex|Kids'?|Girls'?|Boys'?)\b/gi, '');
  n = n.split(/\s+/).filter(w => w.length > 1 || /[a-zA-Z]/.test(w)).join(' ');
  n = n.replace(/\s+/g, ' ').trim();
  const queries = [];
  if (n.length > 5) queries.push(n);
  const words = n.split(' ');
  if (words.length > 5) {
    queries.push(words.slice(0, 5).join(' '));
    queries.push(words.slice(0, 3).join(' '));
  }
  const commaIdx = name.indexOf(',');
  if (commaIdx > 5) {
    const firstPart = name.substring(0, commaIdx).trim();
    if (firstPart.length > 5 && !queries.includes(firstPart)) queries.push(firstPart);
  }
  return [...new Set(queries)].filter(q => q.length > 3);
}

async function getFirstImage(page, queries) {
  for (const query of queries) {
    try {
      await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });
      await sleep(2500);
      const imgSrc = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.src;
          if (src && src.includes('/th/id/OIP.') && img.naturalWidth >= 100) {
            return src.replace(/[?&]w=\d+/, '?w=600').replace(/&h=\d+/, '&h=600');
          }
        }
        const allDivs = document.querySelectorAll('[style*="background"]');
        for (const div of allDivs) {
          const style = div.getAttribute('style') || '';
          const match = style.match(/url\(['"]?(https?:\/\/[^'"\)]+\.(?:jpg|jpeg|png|webp)[^'"\)]*)['"]?\)/);
          if (match && match[1].includes('OIP.')) return match[1];
        }
        return null;
      });
      if (imgSrc) return imgSrc;
    } catch(e) { /* next query */ }
  }
  return null;
}

async function main() {
  console.log('=== Fix Search Products: Fetch Images ===\n');

  // Login
  console.log('Logging in...');
  const loginResult = await postJSON(`${API}/main/sendMsg/login`, { username: 'admin', password: 'admin123' });
  const token = loginResult?.data?.token;
  if (!token) { console.error('Login failed'); return; }
  console.log('Login OK\n');

  // Load product details from admin API
  console.log('Loading product details...');
  const targetSet = new Set(TARGET_IDS);
  let allProducts = [], page = 1, total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(`${API}/home/admin/products?page=${page}&pageSize=100`, token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    if (allProducts.length >= total || list.length === 0) break;
    page++;
  }
  const targetProducts = allProducts.filter(p => targetSet.has(p._id));
  console.log(`Target products found: ${targetProducts.length}/${TARGET_IDS.length}`);
  // If not all found, log missing IDs
  if (targetProducts.length < TARGET_IDS.length) {
    const foundIds = new Set(targetProducts.map(p => p._id));
    const missing = TARGET_IDS.filter(id => !foundIds.has(id));
    console.log('Missing product IDs:', missing.join(', '));
  }

  // Load checkpoint
  let checkpoint = [];
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try { checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch(e) {}
  }
  const processed = new Set(checkpoint.map(c => c._id));
  const remaining = targetProducts.filter(p => !processed.has(p._id));
  console.log(`Already processed: ${processed.size}, Remaining: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('All products already processed!');
    // Do final batch update
    const pendingUpdates = checkpoint.filter(c => c.image).map(c => ({ productId: c._id, images: [c.image] }));
    if (pendingUpdates.length > 0) {
      console.log(`Performing final batch update for ${pendingUpdates.length} products...`);
      const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: pendingUpdates }, token);
      console.log(`Result: ${result?.msg || JSON.stringify(result).slice(0, 100)}`);
    }
    return;
  }

  // Launch browser
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,720'],
    defaultViewport: { width: 1280, height: 720 },
  });
  const bingPage = await browser.newPage();
  await bingPage.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  let succeeded = 0, failed = 0, batch = [];

  for (let i = 0; i < remaining.length; i++) {
    const product = remaining[i];
    const name = product?.name || product?.title || 'Unknown';
    const queries = buildQueries(name);

    console.log(`[${i+1}/${remaining.length}] ${name.substring(0, 50)}...`);
    console.log(`  Queries: ${queries.map(q => q.substring(0, 40)).join(' | ')}`);

    try {
      const imgUrl = await getFirstImage(bingPage, queries);
      if (!imgUrl) {
        console.log(`  -> NO MATCH`);
        checkpoint.push({ _id: product._id, status: 'skipped' });
        failed++;
      } else {
        batch.push({ productId: product._id, images: [imgUrl] });
        checkpoint.push({ _id: product._id, status: 'ok', image: imgUrl });
        succeeded++;
        console.log(`  -> OK: ${imgUrl.substring(0, 70)}`);
      }
    } catch (err) {
      console.log(`  -> ERROR: ${err.message}`);
      failed++;
      checkpoint.push({ _id: product._id, status: 'error', error: err.message });
    }

    // Batch update every 5
    if (batch.length >= 5) {
      console.log(`  Batch updating ${batch.length}...`);
      try {
        const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
        console.log(`  -> ${result?.msg || 'OK'}`);
      } catch (err) { console.log(`  -> FAILED: ${err.message}`); }
      batch = [];
    }

    // Checkpoint every 5
    if ((i + 1) % 5 === 0 || i === 0) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint));
      console.log(`\n  === CP: ${i+1}/${remaining.length} OK:${succeeded} Fail:${failed} ===\n`);
    }

    await sleep(1000 + Math.random() * 1000);
  }

  // Final batch
  if (batch.length > 0) {
    console.log(`Final batch updating ${batch.length}...`);
    try {
      const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
      console.log(`  -> ${result?.msg || 'OK'}`);
    } catch (err) { console.log(`  -> FAILED: ${err.message}`); }
  }

  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint));
  console.log(`\n=== DONE ===`);
  console.log(`Total: ${remaining.length} | OK: ${succeeded} | Failed: ${failed}`);

  await browser.close();
}

main().catch(console.error);
