const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CHECKPOINT_FILE = path.join(__dirname, 'bing_checkpoint.json');
const V2_CHECKPOINT_FILE = path.join(__dirname, 'bing_v2_checkpoint.json');
const PER_PAGE = 100;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('Parse error')); } });
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

// Smart query preprocessor: strip noise, keep meaningful keywords
function buildQueries(name) {
  if (!name) return [];
  let n = name;
  
  // Remove parenthetical content like (Black, 2XL), (Pack of 6), etc.
  n = n.replace(/\([^)]*\)/g, '').trim();
  
  // Remove common quantity/size patterns
  n = n.replace(/\d+[\s]*[.×xX]?[\s]*\d*[\s]*(?:oz|ml|fl oz|ounce|pound|lb|count|pack|set|kit|bundle|pcs|pieces|capsules|tablets|servings|g|mg|kg| fl |qt|inch|cm|mm)/gi, '');
  
  // Remove standalone numbers
  n = n.replace(/\b\d+[\s]*(?:oz|ml|fl|count|pack|set|oz\.|ml\.|fl\.|lbs?|in|cm|mm|g|mg|kg)\b/gi, '');
  
  // Remove gendered prefixes
  n = n.replace(/\b(Women'?s?|Men'?s?|for Women|for Men|Unisex|Kids'?|Girls'?|Boys'?)\b/gi, '');
  
  // Remove pure number tokens and very short tokens
  n = n.split(/\s+/).filter(w => w.length > 1 || /[a-zA-Z]/.test(w)).join(' ');
  
  // Trim multiple spaces
  n = n.replace(/\s+/g, ' ').trim();
  
  const queries = [];
  
  // Strategy 1: Full cleaned name
  if (n.length > 5) queries.push(n);
  
  // Strategy 2: Brand + first 3-5 meaningful words
  const words = n.split(' ');
  if (words.length > 5) {
    queries.push(words.slice(0, 5).join(' '));
    queries.push(words.slice(0, 3).join(' '));
  }
  
  // Strategy 3: For luxury brand names, try brand + style (last meaningful word(s))
  const luxuryBrands = ['tory burch', 'brahmin', 'frye', 'adrianna papell', 'alex evenings',
    'rebecca minkoff', 'ronny kobo', 'norma kamali', 'betsy', 'bellroy',
    'maggy london', 'kate spade', 'michael kors', 'true religion',
    'madewell', 'tumi', 'lacoste', 'coach', 'cole haan', 'pendleton',
    'eric javits', 'bed|stu', 'noble panacea', 'cle de peau', 'sulwhasoo',
    'dr. barbara sturm', 'christophe robin', 'pietro simone', 'natura bissé',
    'free people', 'nic+ZOE'];
  
  const lower = n.toLowerCase();
  for (const brand of luxuryBrands) {
    if (lower.includes(brand)) {
      // Try brand + first 2 style words after brand
      const brandIdx = lower.indexOf(brand);
      const afterBrand = n.substring(brandIdx + brand.length).trim();
      const styleWords = afterBrand.split(' ').filter(w => w.length > 2).slice(0, 3);
      if (styleWords.length > 0) {
        queries.push(`${brand} ${styleWords.join(' ')}`);
      }
      break;
    }
  }
  
  // Strategy 4: First comma-separated part (before specs)
  const commaIdx = name.indexOf(',');
  if (commaIdx > 5) {
    const firstPart = name.substring(0, commaIdx).trim();
    if (firstPart.length > 5 && !queries.includes(firstPart)) {
      queries.push(firstPart);
    }
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
      await sleep(2500); // Longer wait for more complete rendering

      const imgSrc = await page.evaluate(() => {
        const imgs = document.querySelectorAll('img');
        for (const img of imgs) {
          const src = img.src;
          if (src && src.includes('/th/id/OIP.') && img.naturalWidth >= 100) {
            return src.replace(/[?&]w=\d+/, '?w=600').replace(/&h=\d+/, '&h=600');
          }
        }
        // Fallback: look for images in background
        const allDivs = document.querySelectorAll('[style*="background"]');
        for (const div of allDivs) {
          const style = div.getAttribute('style') || '';
          const match = style.match(/url\(['"]?(https?:\/\/[^'"\)]+\.(?:jpg|jpeg|png|webp)[^'"\)]*)['"]?\)/);
          if (match && match[1].includes('OIP.')) return match[1];
        }
        return null;
      });

      if (imgSrc) return imgSrc;
    } catch(e) {
      // Try next query
    }
  }
  return null;
}

async function main() {
  console.log('=== Bing Image Scraper V2 (smart queries) ===\n');

  // Login
  console.log('Logging in...');
  const loginResult = await postJSON(`${API}/main/sendMsg/login`, { username: 'admin', password: 'admin123' });
  const token = loginResult?.data?.token;
  if (!token) { console.error('Login failed'); return; }
  console.log('Login OK\n');

  // Load products
  console.log('Loading products...');
  let allProducts = [];
  let page = 1, total = Infinity;
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
  const productMap = {};
  allProducts.forEach(p => { productMap[p._id] = p; });

  // Load V1 checkpoint to find skipped products
  let v1Checkpoint = [];
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try { v1Checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); } catch(e) {}
  }
  const skipped = v1Checkpoint.filter(c => c.status === 'skipped');
  console.log(`\nV1 skipped products: ${skipped.length}`);

  // Load V2 checkpoint
  let v2Checkpoint = [];
  if (fs.existsSync(V2_CHECKPOINT_FILE)) {
    try { v2Checkpoint = JSON.parse(fs.readFileSync(V2_CHECKPOINT_FILE, 'utf8')); } catch(e) {}
    console.log(`V2 checkpoint: ${v2Checkpoint.length} processed`);
  }
  const v2Processed = new Set(v2Checkpoint.map(c => c._id));
  const remaining = skipped.filter(c => !v2Processed.has(c._id));
  console.log(`Remaining for V2: ${remaining.length}\n`);

  if (remaining.length === 0) {
    console.log('All skipped products already processed in V2!');
    return;
  }

  // Launch browser
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

  let succeeded = 0, failed = 0, batch = [];

  for (let i = 0; i < remaining.length; i++) {
    const entry = remaining[i];
    const product = productMap[entry._id];
    const name = product?.name || product?.title || 'Unknown';
    
    const queries = buildQueries(name);
    console.log(`[${i+1}/${remaining.length}] ${name.substring(0, 50)}...`);
    console.log(`  Queries: ${queries.map(q => q.substring(0, 40)).join(' | ')}`);

    try {
      const imgUrl = await getFirstImage(bingPage, queries);

      if (!imgUrl) {
        console.log(`  -> NO MATCH (tried ${queries.length} queries)`);
        v2Checkpoint.push({ _id: entry._id, status: 'skipped' });
      } else {
        batch.push({ productId: entry._id, images: [imgUrl] });
        v2Checkpoint.push({ _id: entry._id, status: 'ok', image: imgUrl });
        succeeded++;
        console.log(`  -> OK: ${imgUrl.substring(0, 70)}`);
      }
    } catch (err) {
      console.log(`  -> ERROR: ${err.message}`);
      failed++;
      v2Checkpoint.push({ _id: entry._id, status: 'error', error: err.message });
    }

    // Batch update every 10
    if (batch.length >= 10) {
      console.log(`  Batch updating ${batch.length}...`);
      try {
        const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
        console.log(`  -> ${result?.msg || 'OK'}`);
      } catch (err) { console.log(`  -> FAILED: ${err.message}`); }
      batch = [];
    }

    // Checkpoint every 15
    if ((i + 1) % 15 === 0 || i === 0) {
      fs.writeFileSync(V2_CHECKPOINT_FILE, JSON.stringify(v2Checkpoint));
      console.log(`\n  === V2 CP: ${i+1}/${remaining.length} OK:${succeeded} Fail:${failed} ===\n`);
    }

    await sleep(800 + Math.random() * 1200);
  }

  // Final batch
  if (batch.length > 0) {
    console.log(`Final batch updating ${batch.length}...`);
    try {
      const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
      console.log(`  -> ${result?.msg || 'OK'}`);
    } catch (err) { console.log(`  -> FAILED: ${err.message}`); }
  }

  fs.writeFileSync(V2_CHECKPOINT_FILE, JSON.stringify(v2Checkpoint));
  console.log(`\n=== V2 DONE ===`);
  console.log(`Total: ${remaining.length} | OK: ${succeeded} | Failed: ${failed}`);

  await browser.close();
}

main().catch(console.error);
