const https = require('https');

const API = 'https://supportive-delight-production-b90c.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

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
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
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
      'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '',
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

const checkImageAlive = (url) => new Promise((resolve) => {
  if (!url || !url.startsWith('http')) { resolve(false); return; }
  const proxyUrl = API + '/home/image/proxy?url=' + encodeURIComponent(url);
  const u = new URL(proxyUrl);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000,
  };
  const chunks = [];
  const req = https.request(opts, (res) => {
    res.on('data', (c) => { chunks.push(c); });
    res.on('end', () => {
      const buf = Buffer.concat(chunks);
      const firstByte = buf[0];
      const isImage = firstByte === 0x89 || firstByte === 0xFF || firstByte === 0x47 || firstByte === 0x52;
      resolve(isImage);
    });
  });
  req.on('error', () => resolve(false));
  req.on('timeout', () => { req.destroy(); resolve(false); });
  req.end();
});

const pixabaySearch = (query) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5&category=`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0' }, timeout: 15000,
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

const improveQuery = (title) => {
  const t = title.toLowerCase();
  if (t.includes('summer') || t.includes('sale')) return 'summer beach sale fashion shopping';
  if (t.includes('fashion') || t.includes('new arrival')) return 'fashion model clothing style 2026';
  if (t.includes('electron') || t.includes('tech') || t.includes('gadget')) return 'electronics technology gadgets devices';
  if (t.includes('beauty') || t.includes('skincare') || t.includes('cosmetic')) return 'beauty skincare cosmetics makeup';
  if (t.includes('sport') || t.includes('outdoor') || t.includes('fitness')) return 'sports outdoors fitness adventure';
  return t.replace(/[^a-zA-Z0-9 ]/g, '').trim();
};

const main = async () => {
  console.log('Logging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password: PASSWORD });
  if (loginRes.code !== 0) { console.error('Login failed:', loginRes.msg); process.exit(1); }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK\n');

  console.log('Fetching current banners...');
  const bannerRes = await getJSON(`${API}/main/banner/getList`, token);
  const banners = bannerRes.data || bannerRes.list || [];
  console.log(`Found ${banners.length} banners\n`);

  if (banners.length === 0) { console.log('No banners to process.'); return; }

  const updates = [];
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    console.log(`[${i + 1}/${banners.length}] "${b.title}"`);

    console.log(`  Checking current image...`);
    const alive = await checkImageAlive(b.image);
    if (alive) {
      console.log(`  OK - image already works, skipping`);
      continue;
    }
    console.log(`  DEAD - needs replacement`);

    const query = improveQuery(b.title);
    console.log(`  Searching Pixabay: "${query}"`);
    let pbRes;
    try {
      pbRes = await pixabaySearch(query);
    } catch (e) {
      console.error(`  Search failed: ${e.message}`);
      await sleep(1000);
      continue;
    }

    if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
      let found = false;
      for (const hit of pbRes.hits) {
        const img = hit.webformatURL;
        const ok = await checkImageAlive(img);
        if (ok) {
          console.log(`  Found fresh image: ${img.slice(0, 70)}`);
          updates.push({ _id: b._id, title: b.title, image: img, link: b.link });
          found = true;
          break;
        }
      }
      if (!found) {
        console.log(`  All results dead, using first result anyway`);
        updates.push({ _id: b._id, title: b.title, image: pbRes.hits[0].webformatURL, link: b.link });
      }
    } else {
      console.log(`  No Pixabay results for "${query}", trying simpler query...`);
      const simpleTitle = b.title.replace(/[-\d]/g, '').replace(/&\s*\w+;/g, '').trim();
      try {
        pbRes = await pixabaySearch(simpleTitle || 'shop banner');
        if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
          const img = pbRes.hits[0].webformatURL;
          console.log(`  Found (fallback): ${img.slice(0, 70)}`);
          updates.push({ _id: b._id, title: b.title, image: img, link: b.link });
        } else {
          console.log(`  No results even with fallback`);
        }
      } catch (e) {
        console.error(`  Fallback failed: ${e.message}`);
      }
    }
    await sleep(800);
  }

  if (updates.length === 0) {
    console.log('\nAll banners already OK. Nothing to update.');
    return;
  }

  console.log(`\nUpdating ${updates.length} banners...`);
  const updateRes = await postJSON(`${API}/home/admin/update-banners`, { banners: updates }, token);
  console.log('Update result:', JSON.stringify(updateRes, null, 2));

  console.log('\nVerifying updates...');
  let verified = 0;
  for (const u of updates) {
    const ok = await checkImageAlive(u.image);
    console.log(`  ${ok ? 'OK' : 'FAIL'} | ${(u.title || '').slice(0, 40)}`);
    if (ok) verified++;
    await sleep(500);
  }
  console.log(`\nDone. ${verified}/${updates.length} verified alive.`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
