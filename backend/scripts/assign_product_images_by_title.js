/**
 * assign_product_images_by_title.js
 *
 * For every product, search Pixabay using the FULL product name as query
 * (instead of extracted keywords) to get images that best match the title.
 *
 * Run: node scripts/assign_product_images_by_title.js
 */
const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
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
    headers: {
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  if (isPost) {
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = Buffer.byteLength(body);
  }
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  if (isPost) req.write(body);
  req.end();
});

const getJSON = (url, token) => request(url, 'GET', null, token);
const postJSON = (url, data, token) => request(url, 'POST', data, token);

const pixabaySearch = (query, page = 1) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&page=${page}&order=popular&editors_choice=true&min_width=400&min_height=300`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImageAssign/1.0)' },
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

// Build specific search queries from the product name
const buildQueries = (name) => {
  const raw = name.trim();
  const queries = [raw];

  // Shortened version (remove size/capacity details for broader match)
  const shortened = raw
    .replace(/\d+(?:TB|GB|mm|cm|"|inch|oz|ml|g)\b/gi, '')
    .replace(/\d+x\d+/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\(\)]/g, '')
    .trim();
  if (shortened && shortened !== raw) queries.push(shortened);

  // Brand + core product name (first 3-4 words)
  const words = raw.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 4) {
    queries.push(words.slice(0, 4).join(' '));
    queries.push(words.slice(0, 5).join(' '));
  }

  // Category-based fallback
  const catKeywords = {
    'Shoes': ['sneakers', 'shoes', 'footwear', 'boots'],
    'Men Clothing': ['men fashion', 'clothing', 'suit', 'jacket'],
    'Women Clothing': ['women fashion', 'dress', 'clothing'],
    'Bags': ['handbag', 'bag', 'backpack', 'tote'],
    'Accessories': ['watch', 'sunglasses', 'jewelry', 'belt'],
    'Smartphones': ['smartphone', 'mobile phone'],
    'Laptops': ['laptop', 'notebook', 'ultrabook'],
    'Headphones': ['headphones', 'earbuds', 'headset'],
    'Television': ['television', 'tv', 'oled tv', '4k tv'],
    'Bluetooth Speakers': ['bluetooth speaker', 'portable speaker'],
    'Speakers': ['speaker', 'bookshelf speaker', 'home audio'],
    'Apple Watch': ['apple watch', 'smartwatch'],
    'Furniture': ['furniture', 'sofa', 'chair', 'desk', 'table'],
    'Skincare': ['skincare', 'face cream', 'serum', 'moisturizer'],
    'Makeup': ['makeup', 'cosmetics', 'lipstick', 'foundation'],
    'Fitness': ['fitness', 'gym equipment', 'exercise', 'yoga'],
  };

  // Extract the most specific brand name from the title
  const brands = ['Apple','Samsung','Sony','Bose','Sennheiser','Marshall','Bowers','KEF','Sonos','JBL',
    'Nike','Adidas','Puma','New Balance','ASICS','Hoka','On Running','Salomon','Timberland',
    'Gucci','Balenciaga','Prada','Louis Vuitton','Hermès','Chanel','Dior','Fendi','Celine',
    'Loewe','Bottega','Valentino','Saint Laurent','Burberry','Ralph Lauren','Tom Ford',
    'Hugo Boss','Armani','Canada Goose','Moncler','North Face','Patagonia','Carhartt',
    'Levi','Dickies','Ray-Ban','Oakley','Omega','Rolex','Tag Heuer','Cartier','IWC',
    'Herman Miller','Steelcase','Peloton','NordicTrack','Rogue','Bowflex','Tonal',
    'LG','Samsung','Panasonic','Hisense','TCL','Dell','HP','Lenovo','ASUS','Microsoft',
    'OnePlus','Google','Hyperice','Theragun','Garmin','COROS','TRX','Manduka','Lululemon',
    'Gymshark','Alo','Tory Burch','Michael Kors','Coach','Tumi','Herschel','Zimmermann',
    'Self-Portrait','La Mer','SkinCeuticals','Tatcha','Estée Lauder','Drunk Elephant',
    'Pat McGrath','Charlotte Tilbury','Fenty','Hourglass','NARS','KVD','Tiffany','Montblanc'];

  for (const brand of brands) {
    if (raw.toLowerCase().includes(brand.toLowerCase())) {
      const nameShort = raw.replace(new RegExp(brand, 'i'), '').trim();
      queries.push(`${brand} ${nameShort.split(/\s+/).slice(0, 3).join(' ')}`);
      break;
    }
  }

  return [...new Set(queries)].filter(q => q.length > 3);
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Assign Product Images by Title');
  console.log('='.repeat(60));

  console.log('\nLogging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) { console.error('Login failed:', loginRes.msg); process.exit(1); }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('\nFetching categories...');
  const catRes = await getJSON(`${API}/home/admin/categories`, token);
  const categories = catRes.data || [];
  const catMap = {};
  for (const c of categories) catMap[c._id] = c.name;
  console.log(`  ${categories.length} categories loaded`);

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
  console.log(`  ${all.length} products loaded`);

  const usedUrls = new Set();
  const updates = [];
  let ok = 0, fail = 0, skip = 0;

  for (let i = 0; i < all.length; i++) {
    const p = all[i];
    const name = (p.name || '').trim();
    const catName = catMap[p.categoryId] || '';
    const id = p._id;
    process.stdout.write(`[${i + 1}/${all.length}] "${name.slice(0, 55)}" -> `);

    if (!name) { process.stdout.write('SKIP (no name)\n'); skip++; continue; }

    const queries = buildQueries(name);
    let foundUrl = null;
    let usedAttempts = 0;

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
              usedAttempts++;
            }
            if (foundUrl) {
              process.stdout.write(`"${q.slice(0, 35)}" `);
              break;
            }
            if (usedAttempts >= 20) break;
          }
        } catch (e) { /* retry next */ }
        await sleep(150);
      }
    }

    if (!foundUrl) {
      // Last resort — search without unique constraint
      for (const q of queries) {
        if (foundUrl) break;
        for (let pg = 1; pg <= 3; pg++) {
          try {
            const pbRes = await pixabaySearch(q, pg);
            if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
              foundUrl = pbRes.hits[0].webformatURL;
              break;
            }
          } catch (e) { }
          await sleep(150);
        }
      }
    }

    if (!foundUrl) {
      process.stdout.write('FAIL\n');
      fail++;
    } else {
      process.stdout.write('OK\n');
      updates.push({ productId: id, images: [foundUrl] });
      ok++;
    }

    await sleep(500);
  }

  console.log(`\nResults: ${ok} OK, ${fail} FAIL, ${skip} SKIPPED`);
  console.log(`Unique images used: ${usedUrls.size}`);

  if (updates.length === 0) { console.log('No updates.'); return; }

  console.log(`\nApplying ${updates.length} image updates in batches of 50...`);
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    process.stdout.write(`  Batch ${Math.floor(i / 50) + 1}/${Math.ceil(updates.length / 50)}... `);
    const upRes = await postJSON(`${API}/home/admin/batch-update-images`, { updates: batch }, token);
    if (upRes.code === 0) {
      process.stdout.write(`OK (${upRes.data?.ok || 0})\n`);
    } else { process.stdout.write(`FAIL: ${upRes.msg}\n`); }
    await sleep(300);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('DONE');
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
