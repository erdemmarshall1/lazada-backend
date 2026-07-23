const https = require('https');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
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

// Tuned Pixabay queries per product name
const PRODUCT_QUERIES = {
  'Designer Nail Art Kit': ['nail art kit', 'nail polish set', 'manicure kit', 'nail design', 'nail art tools'],
  'Premium Stainless Steel Watch': ['stainless steel watch', 'metal wrist watch', 'luxury watch men', 'silver watch', 'wristwatch steel'],
  'Premium Laptop Backpack': ['laptop backpack', 'travel backpack', 'school backpack', 'rucksack bag', 'backpack computer'],
  'Premium Designer Sunglasses': ['designer sunglasses', 'fashion sunglasses', 'sunglasses style', 'sun glasses eyewear', 'retro sunglasses'],
  'Premium Smart Watch': ['smartwatch fitness', 'smart watch digital', 'sport smart watch', 'fitness tracker watch', 'smartwatch wrist'],
  'Premium Bluetooth Speaker': ['bluetooth speaker', 'portable speaker', 'wireless speaker', 'speaker music', 'mini speaker'],
  'Luxury Bookshelf Smart Speaker': ['bookshelf speaker', 'smart speaker home', 'wooden speaker', 'hi-fi speaker', 'audio speaker room'],
  'Designer Luxury Watch Charger': ['watch charger stand', 'smartwatch charger', 'charging dock watch', 'watch charging station', 'wireless charger watch'],
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Assign Specific Product Images (tuned Pixabay queries)');
  console.log('='.repeat(60));

  console.log('\nLogging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password: PASSWORD });
  if (loginRes.code !== 0) { console.error('Login failed:', loginRes.msg); process.exit(1); }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('\nFetching all products...');
  const all = [];
  let page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    all.push(...list);
    page++;
    await sleep(200);
  }
  console.log(`Total products: ${all.length}`);

  // Find target products (match by name substring ignoring case)
  const targetNames = Object.keys(PRODUCT_QUERIES);
  const targets = [];
  for (const p of all) {
    const name = p.name || '';
    for (const tn of targetNames) {
      if (name.toLowerCase().includes(tn.toLowerCase())) {
        targets.push({ product: p, targetName: tn });
        break;
      }
    }
  }

  console.log(`Target products found: ${targets.length}`);
  for (const t of targets) {
    console.log(`  ${t.product._id} | "${t.product.name.slice(0, 60)}"`);
  }

  if (targets.length === 0) {
    console.log('\nNo target products found. Exiting.');
    return;
  }

  const usedUrls = new Set();
  const updates = [];
  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const { product: p, targetName: tn } = targets[i];
    const name = p.name || '';
    const queries = PRODUCT_QUERIES[tn] || [tn];

    console.log(`\n[${i + 1}/${targets.length}] "${name.slice(0, 60)}"`);

    let foundUrl = null;
    for (const q of queries) {
      if (foundUrl) break;
      process.stdout.write(`  Query: "${q}" -> `);
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
      if (foundUrl) {
        process.stdout.write(`OK\n`);
      } else {
        process.stdout.write(`no result\n`);
      }
    }

    if (foundUrl) {
      console.log(`  -> Image: ${foundUrl.slice(0, 80)}`);
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
  console.log(`  Target products: ${targets.length}`);
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
    process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(updates.length / BATCH_SIZE)}... `);
    const upRes = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
    if (upRes.code === 0) {
      totalOk += upRes.data?.ok || 0;
      totalFail += upRes.data?.fail || 0;
      process.stdout.write(`OK (ok: ${upRes.data?.ok || 0})\n`);
    } else {
      process.stdout.write(`FAIL: ${upRes.msg}\n`);
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
