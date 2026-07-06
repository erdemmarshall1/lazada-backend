/**
 * update_banner_images.js
 *
 * 1. Fetch current banners from Railway
 * 2. For each banner, search Pixabay for an image matching the title
 * 3. Update the banner's image URL with a Pixabay webformatURL
 */
const https = require('https');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

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
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&category=`;
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

const bannerKeywords = [
  { idx: 0, keywords: 'summer beach sale fashion' },
  { idx: 1, keywords: 'fashion model clothing 2026' },
  { idx: 2, keywords: 'electronics gadgets technology' },
  { idx: 3, keywords: 'beauty skincare cosmetics' },
  { idx: 4, keywords: 'sports outdoors fitness' },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const main = async () => {
  console.log('Logging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('Fetching current banners...');
  const bannerRes = await getJSON(`${API}/main/banner/getList`, token);
  const banners = bannerRes.data || bannerRes.list || [];
  console.log(`Found ${banners.length} banners`);

  if (banners.length === 0) {
    console.log('No banners to update.');
    return;
  }

  const updates = [];
  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const kw = bannerKeywords[i] || { keywords: banner.title || 'product' };
    console.log(`\n[${i + 1}/${banners.length}] "${banner.title}"`);
    console.log(`  Searching Pixabay for: "${kw.keywords}"`);

    let pbRes;
    try {
      pbRes = await pixabaySearch(kw.keywords);
    } catch (e) {
      console.error(`  Pixabay search failed: ${e.message}`);
      continue;
    }

    if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
      const img = pbRes.hits[0].webformatURL;
      console.log(`  Found: ${img.slice(0, 80)}`);
      updates.push({ _id: banner._id, title: banner.title, image: img, link: banner.link });
    } else {
      console.log('  No results from Pixabay, searching more generic...');
      try {
        pbRes = await pixabaySearch(banner.title?.replace(/[-\d]/g, '').trim() || 'shop');
        if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
          const img = pbRes.hits[0].webformatURL;
          console.log(`  Found (fallback): ${img.slice(0, 80)}`);
          updates.push({ _id: banner._id, title: banner.title, image: img, link: banner.link });
        }
      } catch (e) {
        console.error(`  Fallback failed: ${e.message}`);
      }
    }
    await sleep(500);
  }

  if (updates.length === 0) {
    console.log('\nNo banners to update.');
    return;
  }

  console.log(`\nUpdating ${updates.length} banners...`);
  const updateRes = await postJSON(`${API}/home/admin/update-banners`,
    { banners: updates }, token
  );
  console.log('Result:', JSON.stringify(updateRes, null, 2));
  console.log('\nDone.');
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
