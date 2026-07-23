const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';
const CATEGORY_ID = '6a38e589847311abe2124e73';

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' },
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

const pixabaySearch = (query) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3`;
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  try {
    console.log('Logging in...');
    const login = await postJSON(`${API}/main/user/login`, { username: USERNAME, password: PASSWORD });
    if (login.code !== 0) { console.error('Login failed:', login.msg || login); process.exit(1); }
    const token = login.data.token;
    console.log('Login OK');

    // Fetch skincare products
    console.log(`\nFetching skincare products (category: ${CATEGORY_ID})...`);
    const searchRes = await getJSON(`${API}/main/goods/getSearchList?categoryId=${CATEGORY_ID}&page=1&pageSize=50`, token);
    if (searchRes.code !== 0) { console.error('Failed to fetch:', searchRes); process.exit(1); }
    const products = searchRes.data.list;
    console.log(`Found ${products.length} skincare products\n`);

    let fixed = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const name = product.name || 'Unknown product';
      const oldImg = product.images?.[0] || 'NONE';
      console.log(`[${i + 1}/${products.length}] "${name.substring(0, 50)}"`);

      // Try to find a relevant image on Pixabay
      const query = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      console.log(`  Searching Pixabay for: "${query}"`);

      let imgUrl = null;

      try {
        const pixa = await pixabaySearch(query);
        if (pixa.hits && pixa.hits.length > 0) {
          imgUrl = pixa.hits[0].webformatURL;
          console.log(`  Found: ${imgUrl}`);
        }
      } catch (e) {
        console.log(`  Pixabay search error: ${e.message}`);
      }

      // Fallback: try a broader search based on keywords
      if (!imgUrl) {
        const keywords = name.toLowerCase().match(/(cream|serum|mask|oil|lotion|moisturizer|cleanser|eye|lip|face|skin|beauty)/);
        const fallbackQ = keywords ? keywords[0] + ' skincare product' : 'skincare product';
        console.log(`  No exact match, trying fallback: "${fallbackQ}"`);
        try {
          const pixa = await pixabaySearch(fallbackQ);
          if (pixa.hits && pixa.hits.length > 0) {
            imgUrl = pixa.hits[0].webformatURL;
            console.log(`  Fallback found: ${imgUrl}`);
          }
        } catch (e) {
          console.log(`  Fallback search error: ${e.message}`);
        }
      }

      // Final fallback: generic beauty product
      if (!imgUrl) {
        console.log(`  No results, trying generic fallback...`);
        try {
          const pixa = await pixabaySearch('beauty product');
          if (pixa.hits && pixa.hits.length > 0) {
            imgUrl = pixa.hits[0].webformatURL;
            console.log(`  Generic found: ${imgUrl}`);
          }
        } catch (e) {
          console.log(`  Generic search error: ${e.message}`);
        }
      }

      if (!imgUrl) {
        console.log(`  SKIPPED - no Pixabay image found`);
        skipped++;
        continue;
      }

      // Verify the URL actually works
      try {
        const verified = await new Promise((resolve) => {
          const u = new URL(imgUrl);
          const req = https.get({ hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'HEAD', headers: { 'User-Agent': 'script/1.0' }, timeout: 10000 }, (res) => {
            resolve(res.statusCode === 200 || res.statusCode === 302);
          });
          req.on('error', () => resolve(false));
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.end();
        });
        if (!verified) {
          console.log(`  SKIPPED - URL returned non-200 status`);
          skipped++;
          continue;
        }
      } catch (e) {
        console.log(`  Verification error: ${e.message}, skipping`);
        skipped++;
        continue;
      }

      // Update product
      console.log(`  Updating product image...`);
      try {
        const update = await postJSON(`${API}/home/admin/update-product`, {
          id: product._id,
          images: [imgUrl],
        }, token);
        if (update.code === 0) {
          console.log(`  FIXED (was: ${oldImg.substring(0, 50)}...)`);
          fixed++;
        } else {
          console.log(`  FAILED: ${update.msg || JSON.stringify(update)}`);
          failed++;
        }
      } catch (e) {
        console.log(`  Update error: ${e.message}`);
        failed++;
      }

      // Rate limit: wait 1s between requests to be nice to Pixabay and backend
      if (i < products.length - 1) await sleep(1000);
    }

    console.log(`\n=== Done ===`);
    console.log(`Fixed: ${fixed} | Skipped: ${skipped} | Failed: ${failed} | Total: ${products.length}`);

    if (fixed > 0) {
      console.log(`\nVerify at: ${API}/main/goods/getSearchList?categoryId=${CATEGORY_ID}&page=1&pageSize=50`);
    }
  } catch (e) {
    console.error('Script failed:', e.message);
    process.exit(1);
  }
})();
