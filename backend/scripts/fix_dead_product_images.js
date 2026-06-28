const https = require('https');

const API = 'https://supportive-delight-production-b90c.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';
const CONCURRENT_CHECKS = 10;

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } }); });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } }); });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const pixabaySearch = (query, page = 1) => new Promise((resolve, reject) => {
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&page=${page}&order=popular`;
  const u = new URL(url);
  const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } }); });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const checkImageAlive = (url) => new Promise((resolve) => {
  if (!url || !url.startsWith('http')) { resolve(false); return; }
  const proxyUrl = API + '/home/image/proxy?url=' + encodeURIComponent(url);
  const u = new URL(proxyUrl);
  const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'HEAD', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000 };
  const req = https.request(opts, (res) => {
    const alive = res.statusCode >= 200 && res.statusCode < 400 && !(res.headers.location || '').includes('placeholder');
    resolve(alive);
  });
  req.on('error', () => resolve(false));
  req.on('timeout', () => { req.destroy(); resolve(false); });
  req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CATEGORY_PIXABAY_MAP = {
  '6a38e589847311abe2124e62': 'fashion clothing',
  '6a38e589847311abe2124e73': 'skincare beauty products',
  '6a38e589847311abe2124e75': 'fitness gym equipment',
  '6a38e589847311abe2124e6f': 'smartphone mobile',
  '6a38e589847311abe2124e6c': 'men clothing fashion',
  '6a38e589847311abe2124e72': 'furniture home interior',
  '6a38e589847311abe2124e74': 'makeup cosmetics',
  '6a38e589847311abe2124e63': 'electronics technology',
  '6a38e589847311abe2124e6d': 'women clothing fashion',
  '6a38e589847311abe2124e70': 'laptop notebook computer',
  '6a38e589847311abe2124e71': 'headphones audio music',
  '6a38e589847311abe2124e64': 'home living decor',
  '6a38e589847311abe2124e6e': 'shoes footwear',
  '6a38e589847311abe2124e65': 'beauty cosmetics',
  '6a3ae0712ef9c9a1328c9d56': 'bags handbag backpack',
  '6a3ae0722ef9c9a1328c9d5c': 'television tv',
  '6a38e589847311abe2124e66': 'sports athletic',
  '6a3ae0712ef9c9a1328c9d59': 'accessories fashion',
  '6a3ae0732ef9c9a1328c9d5f': 'bluetooth speaker',
  '6a3ae0732ef9c9a1328c9d62': 'speaker audio',
  '6a3ae0742ef9c9a1328c9d65': 'apple watch smartwatch',
};

const extractKeywords = (name) => {
  const clean = name.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(w => w.length > 2);
  const stopwords = new Set(['the', 'and', 'for', 'with', 'new', '2023', '2024', '2025', '2026', 'hot', 'sale', 'best', 'top', 'high', 'quality', 'oem', 'custom', 'wholesale', 'fashion', 'style', 'luxury', 'elegant', 'women', 'men', 'size', 'color', 'black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 'plus', 'free', 'shipping', 'duty']);
  const brandWords = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'bose', 'jbl', 'puma', 'levi', 'gucci', 'zara', 'hm', 'shein', 'under armour', 'tommy hilfiger', 'calvin klein', 'ralph lauren', 'lacoste', 'the north face', 'carhartt', 'patagonia', 'columbia', 'timberland', 'converse', 'vans', 'new balance', 'asics', 'skechers', 'crocs', 'birkenstock', 'dr martens', 'herman miller', 'steelcase', 'west elm', 'crate barrel', 'pottery barn', 'ikea', 'cerave', 'neutrogena', "l'oreal", 'la roche-posay', 'kiehl', 'clinique', 'estee lauder', 'mac', 'nyx', 'maybelline', 'charlotte tilbury', 'fenty', 'anker', 'garmin', 'fitbit', 'peloton', 'lululemon', 'gymshark', 'bowers', 'wilkins', 'focal', 'bathys', 'tatcha', 'biossance', 'coros'];
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

const findPixabayImage = async (name, catId, catName, usedUrls) => {
  let keywords = extractKeywords(name);
  if (!keywords || keywords.split(' ').filter(w => w.length > 2).length < 2) {
    keywords = CATEGORY_PIXABAY_MAP[catId] || catName || 'product';
  }

  const queries = [keywords];
  if (catName && !queries.includes(catName)) queries.push(catName);
  if (CATEGORY_PIXABAY_MAP[catId] && !queries.includes(CATEGORY_PIXABAY_MAP[catId])) queries.push(CATEGORY_PIXABAY_MAP[catId]);

  for (const q of queries) {
    for (let pg = 1; pg <= 3; pg++) {
      try {
        const pbRes = await pixabaySearch(q, pg);
        if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
          for (const hit of pbRes.hits) {
            if (!usedUrls.has(hit.webformatURL)) {
              usedUrls.add(hit.webformatURL);
              return hit.webformatURL;
            }
          }
        }
      } catch (e) {}
      await sleep(200);
    }
  }
  return null;
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Fix Dead Product Images');
  console.log('Checks if each product image is alive via proxy, replaces dead ones');
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

  console.log('\nChecking product images (parallel batches)...');
  let alive = 0;
  let dead = 0;
  let skipped = 0;
  const deadProducts = [];

  for (let i = 0; i < all.length; i += CONCURRENT_CHECKS) {
    const batch = all.slice(i, i + CONCURRENT_CHECKS);
    const results = await Promise.all(batch.map(async (p) => {
      const url = p.images?.[0];
      if (!url || !url.startsWith('http')) {
        return { product: p, alive: false, reason: 'no_url' };
      }
      const isAlive = await checkImageAlive(url);
      return { product: p, alive: isAlive, reason: isAlive ? null : 'dead_url' };
    }));

    for (const r of results) {
      if (r.alive) {
        alive++;
      } else {
        dead++;
        deadProducts.push(r.product);
      }
    }

    if ((i + CONCURRENT_CHECKS) % 50 === 0 || i + CONCURRENT_CHECKS >= all.length) {
      console.log(`  Checked ${Math.min(i + CONCURRENT_CHECKS, all.length)}/${all.length} — Alive: ${alive}, Dead: ${dead}`);
    }

    await sleep(300);
  }

  console.log(`\nResults: ${alive} alive, ${dead} dead, ${skipped} skipped`);
  console.log(`Products needing replacement: ${deadProducts.length}`);

  if (deadProducts.length === 0) {
    console.log('\nNo products need fixing. All done!');
    return;
  }

  console.log('\nFetching category map...');
  const catRes = await getJSON(`${API}/main/goodsCategory/getList`, token);
  const catMap = {};
  for (const c of catRes.data) catMap[c._id] = c.name;
  console.log(`Loaded ${Object.keys(catMap).length} categories`);

  console.log(`\nSearching Pixabay for ${deadProducts.length} products...`);
  const usedUrls = new Set();
  const updates = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < deadProducts.length; i++) {
    const p = deadProducts[i];
    const name = p.name || '';
    const catId = p.categoryId;
    const catName = catMap[catId] || 'unknown';

    const oldUrl = (p.images?.[0] || '').slice(0, 60);
    console.log(`[${i + 1}/${deadProducts.length}] "${name.slice(0, 50)}" cat="${catName}" old=${oldUrl}...`);

    const foundUrl = await findPixabayImage(name, catId, catName, usedUrls);

    if (foundUrl) {
      console.log(`  -> NEW: ${foundUrl.slice(0, 80)}`);
      updates.push({ productId: p._id, images: [foundUrl] });
      succeeded++;
    } else {
      console.log(`  -> FAIL (no unique Pixabay image found)`);
      failed++;
    }

    await sleep(400);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Search Results: ${succeeded} succeeded, ${failed} failed`);
  console.log(`Unique images used: ${usedUrls.size}`);

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
  console.log('FINAL RESULT:');
  console.log(`  Dead images detected: ${deadProducts.length}`);
  console.log(`  Successfully updated: ${totalOk}`);
  console.log(`  Failed updates:       ${totalFail}`);
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
