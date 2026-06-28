const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: {
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const pixabaySearch = (query, page = 1) => new Promise((resolve, reject) => {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&page=${page}&order=popular`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 15000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CATEGORY_PIXABAY_MAP = {
  '6a38e589847311abe2124e62': 'fashion clothing',          // Fashion
  '6a38e589847311abe2124e73': 'skincare beauty products',   // Skincare
  '6a38e589847311abe2124e75': 'fitness gym equipment',      // Fitness
  '6a38e589847311abe2124e6f': 'smartphone mobile',          // Smartphones
  '6a38e589847311abe2124e6c': 'men clothing fashion',       // Men Clothing
  '6a38e589847311abe2124e72': 'furniture home interior',    // Furniture
  '6a38e589847311abe2124e74': 'makeup cosmetics',           // Makeup
  '6a38e589847311abe2124e63': 'electronics technology',     // Electronics
  '6a38e589847311abe2124e6d': 'women clothing fashion',     // Women Clothing
  '6a38e589847311abe2124e70': 'laptop notebook computer',   // Laptops
  '6a38e589847311abe2124e71': 'headphones audio music',     // Headphones
  '6a38e589847311abe2124e64': 'home living decor',          // Home & Living
  '6a38e589847311abe2124e6e': 'shoes footwear',             // Shoes
  '6a38e589847311abe2124e65': 'beauty cosmetics',           // Beauty
  '6a3ae0712ef9c9a1328c9d56': 'bags handbag backpack',      // Bags
  '6a3ae0722ef9c9a1328c9d5c': 'television tv',              // Television
  '6a38e589847311abe2124e66': 'sports athletic',            // Sports
  '6a3ae0712ef9c9a1328c9d59': 'accessories fashion',        // Accessories
  '6a3ae0732ef9c9a1328c9d5f': 'bluetooth speaker',          // Bluetooth Speakers
  '6a3ae0732ef9c9a1328c9d62': 'speaker audio',              // Speakers
  '6a3ae0742ef9c9a1328c9d65': 'apple watch smartwatch',     // Apple Watch
};

const extractKeywords = (name) => {
  const clean = name.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(w => w.length > 2);
  const stopwords = new Set(['the', 'and', 'for', 'with', 'new', '2023', '2024', '2025', '2026', 'hot', 'sale', 'best', 'top', 'high', 'quality', 'oem', 'custom', 'wholesale', 'fashion', 'style', 'luxury', 'elegant', 'women', 'men', 'size', 'color', 'black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 'plus', 'free', 'shipping', 'duty']);
  const brandWords = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'bose', 'jbl', 'puma', 'levi', 'gucci', 'zara', 'hm', 'shein', 'under armour', 'tommy hilfiger', 'calvin klein', 'ralph lauren', 'lacoste', 'the north face', 'carhartt', 'patagonia', 'columbia', 'timberland', 'converse', 'vans', 'new balance', 'asics', 'skechers', 'crocs', 'birkenstock', 'dr martens', 'herman miller', 'steelcase', 'west elm', 'crate barrel', 'pottery barn', 'ikea', 'cerave', 'neutrogena', "l'oreal", 'la roche-posay', 'kiehl', 'clinique', 'estee lauder', 'mac', 'nyx', 'maybelline', 'charlotte tilbury', 'fenty', 'anker', 'garmin', 'fitbit', 'peloton', 'lululemon', 'gymshark', 'bowers', 'wilkins', 'focal', 'bathys'];
  let keywords = [];
  for (const bw of brandWords) {
    if (clean.toLowerCase().includes(bw)) {
      keywords.push(bw);
    }
  }
  const significant = words.filter(w => !stopwords.has(w.toLowerCase()));
  keywords = keywords.length > 0 ? keywords : significant.slice(0, 4);
  return keywords.join(' ');
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Fix Missing Product Images');
  console.log('Target: products with empty/null/placeholder images only');
  console.log('='.repeat(60));

  console.log('\nLogging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password: PASSWORD });
  if (loginRes.code !== 0) { console.error('Login failed:', loginRes.msg); process.exit(1); }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('\nFetching all products (paginated)...');
  const all = [];
  let page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    all.push(...list);
    console.log(`  Page ${page}: ${list.length} products (total: ${all.length})`);
    page++;
    await sleep(200);
  }
  console.log(`Total products: ${all.length}`);

  const missing = all.filter(p => !p.images || p.images.length === 0 || !p.images[0] || !p.images[0].trim() || p.images[0].includes('placeholder'));
  console.log(`Products with missing images: ${missing.length}`);

  if (missing.length === 0) {
    console.log('\nNo products need images. All done!');
    return;
  }

  console.log('\nFetching category map...');
  const catRes = await getJSON(`${API}/main/goodsCategory/getList`, token);
  const catMap = {};
  for (const c of catRes.data) catMap[c._id] = c.name;
  console.log(`Loaded ${Object.keys(catMap).length} categories`);

  const usedUrls = new Set();
  const updates = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const p = missing[i];
    const name = p.name || '';
    const catId = p.categoryId;
    const catName = catMap[catId] || 'unknown';
    console.log(`\n[${i + 1}/${missing.length}] "${name.slice(0, 60)}" (${catName})`);

    // First try: extract keywords from product name
    let keywords = extractKeywords(name);
    console.log(`  Keywords: "${keywords}"`);

    // Second try: use category fallback if no good keywords
    if (!keywords || keywords.split(' ').filter(w => w.length > 2).length < 2) {
      keywords = CATEGORY_PIXABAY_MAP[catId] || catName || 'product';
      console.log(`  Using category fallback: "${keywords}"`);
    }

    // Build query variations to try
    const queries = [keywords];
    if (catName && !queries.includes(catName)) queries.push(catName);
    if (CATEGORY_PIXABAY_MAP[catId] && !queries.includes(CATEGORY_PIXABAY_MAP[catId])) queries.push(CATEGORY_PIXABAY_MAP[catId]);

    let foundUrl = null;
    for (const q of queries) {
      if (foundUrl) break;
      for (let pg = 1; pg <= 3; pg++) {
        try {
          const pbRes = await pixabaySearch(q, pg);
          if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
            for (const hit of pbRes.hits) {
              if (!usedUrls.has(hit.webformatURL)) {
                foundUrl = hit.webformatURL;
                usedUrls.add(foundUrl);
                break;
              }
            }
            if (foundUrl) break;
          }
        } catch (e) { }
        await sleep(200);
      }
    }

    if (foundUrl) {
      console.log(`  -> OK: ${foundUrl.slice(0, 80)}`);
      updates.push({ productId: p._id, images: [foundUrl] });
      succeeded++;
    } else {
      console.log(`  -> FAIL (no unique image found)`);
      failed++;
    }

    await sleep(400);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results:`);
  console.log(`  Products needing images: ${missing.length}`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Unique images used: ${usedUrls.size}`);

  if (updates.length === 0) {
    console.log('\nNo updates to apply.');
    return;
  }

  console.log(`\nUploading ${updates.length} image updates in batches of 50...`);
  const BATCH_SIZE = 50;
  let totalOk = 0;
  let totalFail = 0;

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updates.length / BATCH_SIZE)}... `);
    const upRes = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
    if (upRes.code === 0) {
      totalOk += upRes.data?.ok || 0;
      totalFail += upRes.data?.fail || 0;
      console.log(`    OK (successful: ${upRes.data?.ok || 0})`);
    } else {
      console.log(`    FAIL: ${upRes.msg}`);
      totalFail += batch.length;
    }
    await sleep(500);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FINAL RESULT:`);
  console.log(`  Successfully updated: ${totalOk}`);
  console.log(`  Failed updates:       ${totalFail}`);
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
