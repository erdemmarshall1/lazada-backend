/**
 * fix_failed_images.js
 *
 * Fix the 14 products that failed to get images in the title-based search.
 * Uses broader queries, category keywords, and no editors_choice filter.
 */
const https = require('https');

const API = 'https://supportive-delight-production-b90c.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const request = (url, method, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const isPost = method === 'POST';
  const body = isPost ? JSON.stringify(data) : null;
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + (isPost ? '' : u.search),
    method,
    headers: { 'User-Agent': 'fix-script/1.0', token: token || '',
      Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' },
    timeout: 30000,
  };
  if (isPost) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(body); }
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } }); });
  req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  if (isPost) req.write(body); req.end();
});

const getJSON = (url, token) => request(url, 'GET', null, token);
const postJSON = (url, data, token) => request(url, 'POST', data, token);

const pixabaySearch = (query, page = 1, editorsChoice = false) => new Promise((resolve, reject) => {
  const ec = editorsChoice ? '&editors_choice=true' : '';
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&page=${page}&order=popular${ec}`;
  const u = new URL(url);
  const opts = { hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } }); });
  req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); }); req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const CATEGORY_FALLBACKS = {
  '6a38e589847311abe2124e72': ['furniture', 'sofa', 'living room', 'interior', 'chair', 'table'],
  '6a38e589847311abe2124e63': ['electronics', 'laptop', 'technology', 'smart tv', 'speaker'],
  '6a38e589847311abe2124e71': ['headphones', 'earbuds', 'music', 'audio'],
  '6a38e589847311abe2124e70': ['laptop', 'notebook', 'computer', 'macbook', 'ultrabook'],
  '6a38e589847311abe2124e6c': ['men fashion', 'clothing', 'jacket', 'sweater', 'shirt'],
};

const BROAD_QUERIES = [
  { name: 'Crate & Barrel Lounge Chair', queries: ['lounge chair', 'armchair interior', 'living room chair', 'modern chair', 'furniture chair'] },
  { name: 'IKEA BILLY Bookcase', queries: ['bookcase', 'bookshelf', 'bookshelf interior', 'bookcase room', 'home library'] },
  { name: 'Bowers & Wilkins Zeppelin', queries: ['zeppelin speaker', 'wireless speaker interior', 'home audio speaker', 'bookshelf speaker', 'premium speaker'] },
  { name: 'Panasonic OLED MZ2000', queries: ['oled tv', 'television living room', '4k tv', 'smart tv', 'tv screen'] },
  { name: 'LG C4 OLED', queries: ['oled tv', 'tv living room', 'flat screen tv', 'television', '4k tv home'] },
  { name: 'Hisense U8N Mini-LED', queries: ['mini led tv', 'tv living room', '4k television', 'flat screen', 'home theater tv'] },
  { name: 'Samsung Frame QLED', queries: ['frame tv', 'qled tv', 'samsung tv', 'tv art', 'television living room'] },
  { name: 'LG G4 OLED evo', queries: ['oled tv', 'wall mounted tv', 'large tv', 'home theater', 'television modern'] },
  { name: 'Master & Dynamic MW75', queries: ['premium headphones', 'wireless headphones', 'headphones studio', 'noise cancelling headphones', 'audio headphones'] },
  { name: 'Bowers & Wilkins Px8', queries: ['luxury headphones', 'wireless headphones', 'premium headphones leather', 'noise cancelling', 'headphones studio'] },
  { name: 'Apple MacBook Pro 16', queries: ['macbook', 'laptop apple', 'macbook pro', 'laptop desk', 'notebook computer'] },
  { name: 'Apple MacBook Pro 14', queries: ['macbook', 'laptop apple', 'macbook pro', 'laptop office', 'notebook'] },
  { name: 'Apple MacBook Air 15', queries: ['macbook air', 'laptop thin', 'apple laptop', 'laptop desk', 'notebook'] },
  { name: 'Patagonia better Sweater', queries: ['fleece jacket', 'sweater fleece', 'patagonia jacket', 'outdoor sweater', 'quarter zip fleece'] },
];

const main = async () => {
  console.log('Fixing 14 failed product images...\n');

  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password: PASSWORD });
  if (loginRes.code !== 0) { console.error('Login failed'); process.exit(1); }
  const token = loginRes.data?.token || loginRes.token;

  // Fetch all products
  const all = [];
  let page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    all.push(...list); page++; await sleep(150);
  }
  console.log(`Total products: ${all.length}`);

  const catRes = await getJSON(`${API}/home/admin/categories`, token);
  const catMap = {}; for (const c of catRes.data) catMap[c._id] = c.name;

  const updates = [];
  let ok = 0;

  for (const prod of all) {
    const name = prod.name || '';
    const catId = prod.categoryId;
    const catName = catMap[catId] || '';
    const match = BROAD_QUERIES.find(q => name.includes(q.name));
    if (!match) continue;

    process.stdout.write(`"${name.slice(0, 50)}" -> `);
    let foundUrl = null;

    // Try each query
    for (const q of match.queries) {
      if (foundUrl) break;
      for (let pg = 1; pg <= 3; pg++) {
        try {
          const res = await pixabaySearch(q, pg, false);
          if (res.totalHits > 0 && res.hits.length > 0) {
            foundUrl = res.hits[0].webformatURL;
            break;
          }
        } catch (e) { }
        await sleep(150);
      }
    }

    // Last resort: category fallback
    if (!foundUrl) {
      const catFallbacks = CATEGORY_FALLBACKS[catId] || ['product', 'fashion', 'electronics'];
      for (const cf of catFallbacks) {
        if (foundUrl) break;
        try {
          const res = await pixabaySearch(cf, 1, false);
          if (res.totalHits > 0 && res.hits.length > 0) { foundUrl = res.hits[0].webformatURL; }
        } catch (e) { }
        await sleep(150);
      }
    }

    if (foundUrl) {
      process.stdout.write('OK\n');
      updates.push({ productId: prod._id, images: [foundUrl] });
      ok++;
    } else {
      process.stdout.write('FAIL\n');
    }

    await sleep(400);
  }

  console.log(`\nFixed: ${ok} products`);

  if (updates.length > 0) {
    process.stdout.write('\nApplying updates... ');
    const upRes = await postJSON(`${API}/home/admin/batch-update-images`, { updates }, token);
    if (upRes.code === 0) { process.stdout.write(`OK (${upRes.data?.ok || 0})\n`); }
    else { process.stdout.write(`FAIL: ${upRes.msg}\n`); }
  }

  console.log('\nDone.');
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
