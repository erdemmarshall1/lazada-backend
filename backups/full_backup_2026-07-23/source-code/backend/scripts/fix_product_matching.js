/**
 * fix_product_matching.js
 *
 * For ALL products on Railway, searches Pixabay using the product name
 * and assigns the top matching image. Uploads images to Railway and
 * batch-updates product records.
 *
 * Run: node scripts/fix_product_matching.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// ---- Configuration ----
const API_BASE = 'https://supportive-delight-production-b90c.up.railway.app';
const TMP_DIR = path.join(__dirname, '..', '..', 'tmp_images');
const LOG_FILE = path.join(__dirname, '..', '..', 'product_match_log.json');
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';

if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

let TOKEN = '';

// ---- HTTP helper ----
function request(url, opts, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: {
        'User-Agent': 'fix-matching/1.0',
        ...(TOKEN ? { token: TOKEN, Authorization: 'Bearer ' + TOKEN, 'x-access-token': TOKEN } : {}),
        ...(opts.headers || {}),
      },
      timeout: 60000,
    };
    if (body) {
      if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = opts.contentType || 'application/json';
      }
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, raw: data.slice(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// Simple GET for binary data
function download(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 30000,
    };
    const chunks = [];
    const req = https.request(options, (res) => {
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ---- Auth ----
async function login() {
  const body = JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS });
  const r = await request(`${API_BASE}/main/user/login`, { method: 'POST' }, body);
  if (r.data && r.data.code === 0) {
    TOKEN = r.data.data.token;
    console.log('  Login OK');
  } else {
    throw new Error('Login failed: ' + JSON.stringify(r.data));
  }
}

// ---- Fetch all products ----
async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const r = await request(`${API_BASE}/main/goods/getSearchList?page=${page}&pageSize=100`, { method: 'GET' });
    if (r.data && r.data.code === 0 && r.data.data && r.data.data.list) {
      all.push(...r.data.data.list);
      if (r.data.data.list.length < 100) break;
    } else break;
  }
  return all;
}

// ---- Search Pixabay ----
function pixabaySearch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&order=popular&min_width=400&min_height=300`;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
      headers: { 'User-Agent': 'fix-matching/1.0' },
      timeout: 15000,
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.totalHits > 0 && j.hits && j.hits.length > 0) {
            resolve(j.hits[0].webformatURL);
          } else resolve(null);
        } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// Extract top search keywords from product name
function getSearchQuery(name, brand, category) {
  const brandWords = ['apple','samsung','sony','nike','adidas','gucci','prada','hermès','louis','garmin',
    'bose','sony','jbl','marshall','balenciaga','dior','chanel','fendi','puma','reebok','h&m','zara',
    'north','patagonia','columbia','timberland','hugo','boss','armani','ralph','lauren','ray-ban',
    'oakley','omega','rolex','tag','heuer','cartier','tiffany','levi','dickies','carhartt',
    'lg','panasonic','hisense','tcl','dell','hp','lenovo','asus','microsoft','oneplus','google',
    'hyperice','theragun','coros','trx','manduka','lululemon','gymshark','alo','tory','burch',
    'michael','kors','coach','tumi','herschel','zimmermann','self-portrait','la mer',
    'skinceuticals','tatcha','estée lauder','drunk elephant','pat mcgrath','charlotte tilbury',
    'fenty','hourglass','nars','kvd','montblanc','herman','miller','steelcase','peloton',
    'nordictrack','rogue','bowflex','tonal','redmagic','oneplus','nubia','asus','roccat',
    'corsair','razer','logitech','steelseries','hyperx','cougar','secretlab','noblechairs',
    'dxracer','auts','ergo' ];
  const parts = (name || '').split(/[\s,/]+/).filter(w => w.length > 1);
  let keywords = parts.slice(0, 6);
  // Check for known brand
  for (const p of parts) {
    if (brandWords.some(b => p.toLowerCase().startsWith(b))) {
      keywords = parts.slice(parts.indexOf(p), parts.indexOf(p) + 6);
      break;
    }
  }
  // Remove common generic words
  const generic = ['premium','luxury','designer','high','quality','best','new','hot','sale',
    'fashion','genuine','original','leather','fabric','cotton','polyester','women','men',
    'kids','girl','boy','adult','size','color','style','type','inch','free','shipping',
    'brand','top','classic','elegant','modern','trendy','vintage','unique','exclusive',
    'amazing','perfect','great','super','ultra','mega','giga'];
  keywords = keywords.filter(w => !generic.includes(w.toLowerCase()));
  return keywords.slice(0, 4).join(' ');
}

// ---- Upload to Railway ----
async function uploadImage(filePath) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  const boundary = '----' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' }[ext] || 'application/octet-stream';
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(header, 'utf8'), fileData, Buffer.from(footer, 'utf8')]);

  const r = await request(`${API_BASE}/home/upload/file`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  }, body);

  if (r.data && (r.data.code === 0 || r.data.code === 200)) {
    return r.data.data.url || r.data.data.path || `/uploads/${fileName}`;
  }
  throw new Error('Upload failed: ' + JSON.stringify(r.data || r.raw).slice(0, 100));
}

// ---- Batch update ----
async function batchUpdate(updates) {
  const body = JSON.stringify({ updates });
  const r = await request(`${API_BASE}/home/admin/batch-update-images`, { method: 'POST' }, body);
  return r.data;
}

// ---- Sleep ----
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- Main ----
async function main() {
  console.log('=== Product Image Matching Fix (Pixabay) ===\n');

  // 1. Login
  console.log('1. Logging in to Railway admin...');
  await login();

  // 2. Fetch all products
  console.log('2. Fetching all products...');
  const allProducts = await fetchAllProducts();
  console.log('   Total: ' + allProducts.length + ' products');

  // 3. Process each product
  console.log('3. Searching Pixabay for each product and updating...');
  const matchLog = [];
  let pixabayHits = 0;
  let pixabayMiss = 0;
  let uploaded = 0;
  let errors = 0;
  const batch = [];
  const BATCH_SIZE = 15;

  for (let i = 0; i < allProducts.length; i++) {
    const product = allProducts[i];
    const query = getSearchQuery(product.name, product.brand, product.categoryName);

    const entry = {
      productId: product._id,
      productName: (product.name || '').substring(0, 60),
      query,
    };

    try {
      if (query) {
        const imgUrl = await pixabaySearch(query);
        if (imgUrl) {
          pixabayHits++;
          entry.pixabayUrl = imgUrl;

          // Download image
          const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
          const tmpPath = path.join(TMP_DIR, `${product._id}${ext}`);
          const data = await download(imgUrl);
          fs.writeFileSync(tmpPath, data);

          // Upload to Railway
          const uploadedPath = await uploadImage(tmpPath);
          uploaded++;
          entry.uploadedPath = uploadedPath;
          batch.push({ productId: product._id, images: [uploadedPath] });

          // Cleanup
          try { fs.unlinkSync(tmpPath); } catch {}
        } else {
          pixabayMiss++;
          entry.status = 'no_pixabay_result';
        }
      } else {
        pixabayMiss++;
        entry.status = 'no_query';
      }
    } catch (e) {
      errors++;
      entry.error = e.message;
    }

    matchLog.push(entry);

    // Flush batch
    if (batch.length >= BATCH_SIZE) {
      const result = await batchUpdate(batch);
      batch.length = 0;
      process.stdout.write(`   [${i + 1}/${allProducts.length}] hits:${pixabayHits} miss:${pixabayMiss} uploaded:${uploaded} errors:${errors}\n`);
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`   [${i + 1}/${allProducts.length}] hits:${pixabayHits} miss:${pixabayMiss} uploaded:${uploaded} errors:${errors}\n`);
    }
  }

  // Flush remaining
  if (batch.length > 0) {
    await batchUpdate(batch);
  }

  // 4. Results
  console.log('\n=== Results ===');
  console.log('Total products: ' + allProducts.length);
  console.log('Pixabay hits: ' + pixabayHits);
  console.log('Pixabay misses: ' + pixabayMiss);
  console.log('Uploaded: ' + uploaded);
  console.log('Errors: ' + errors);

  // Only save the products that got new images
  const updatedLog = matchLog.filter(e => e.uploadedPath);
  fs.writeFileSync(LOG_FILE, JSON.stringify(updatedLog, null, 2), 'utf8');
  console.log('Log saved to ' + LOG_FILE);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
