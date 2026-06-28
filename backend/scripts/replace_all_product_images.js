/**
 * replace_all_product_images.js
 *
 * Fetches ALL products from Railway, searches Pixabay for each product
 * title, assigns a UNIQUE image per product (no duplicates across products),
 * and batch-updates via /home/admin/batch-update-images.
 */
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
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
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
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const pixabaySearch = (query, page = 1) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&page=${page}&min_width=400&min_height=300`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0' },
    timeout: 15000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const extractKeywords = (name) => {
  const clean = name.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(w => w.length > 2);
  const stopwords = new Set(['the', 'and', 'for', 'with', 'new', '2023', '2024', '2025', '2026', 'hot', 'sale', 'best', 'top', 'high', 'quality', 'oem', 'custom', 'wholesale', 'fashion', 'style', 'luxury', 'elegant', 'women', 'men', 'size', 'color', 'black', 'white', 'blue', 'red', 'green', 'gold', 'silver', 'plus', 'free', 'shipping', 'duty']);
  const brandWords = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'bose', 'jbl', 'puma', 'levi', 'gucci', 'zara', 'hm', 'shein', 'under armour', 'tommy hilfiger', 'calvin klein', 'ralph lauren', 'lacoste', 'the north face', 'carhartt', 'patagonia', 'columbia', 'timberland', 'converse', 'vans', 'new balance', 'asics', 'skechers', 'crocs', 'birkenstock', 'dr martens', 'herman miller', 'steelcase', 'west elm', 'crate barrel', 'pottery barn', 'ikea', 'cerave', 'neutrogena', "l'oreal", 'la roche-posay', 'kiehl', 'clinique', 'estee lauder', 'mac', 'nyx', 'maybelline', 'charlotte tilbury', 'fenty', 'anker', 'garmin', 'fitbit', 'peloton', 'lululemon', 'gymshark'];

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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const main = async () => {
  console.log('='.repeat(60));
  console.log('Product Image Replacement - Unique Pixabay Per Product');
  console.log('='.repeat(60));

  console.log('\nLogging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
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

  const usedUrls = new Set();
  const updates = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const name = p.name || '';
    const id = p._id;
    process.stdout.write(`[${i + 1}/${all.length}] "${name.slice(0, 50)}..." -> `);

    const keywords = extractKeywords(name);
    if (!keywords) {
      process.stdout.write('SKIP (no keywords)\n');
      skipped++;
      continue;
    }

    let foundUrl = null;
    for (let page = 1; page <= 3; page++) {
      try {
        const pbRes = await pixabaySearch(keywords, page);
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
      } catch (e) {
        // retry next page
      }
      await sleep(200);
    }

    if (!foundUrl) {
      process.stdout.write('FAIL (no unique image)\n');
      failed++;
    } else {
      process.stdout.write(`OK\n`);
      updates.push({ productId: id, images: [foundUrl] });
      succeeded++;
    }

    await sleep(400);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Results:`);
  console.log(`  Succeeded: ${succeeded}`);
  console.log(`  Failed:    ${failed}`);
  console.log(`  Skipped:   ${skipped}`);
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
    const upRes = await postJSON(`${API}/home/admin/batch-update-images`,
      { updates: batch }, token
    );
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
  console.log(`  Total updated: ${totalOk}`);
  console.log(`  Total failed:  ${totalFail}`);
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
