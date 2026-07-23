const https = require('https');
const API = 'https://lazada-backend-production-3b57.up.railway.app';
const CONCURRENCY = 30;

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  });
  req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  req.write(json); req.end();
});
const getJSON = (url, token) => new Promise((resolve, reject) => {
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  https.get(url, { headers, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

const urlExists = (url) => new Promise(resolve => {
  if (!url) return resolve(false);
  const absUrl = url.startsWith('http') ? url : API + url;
  https.get(absUrl, { method: 'HEAD', timeout: 10000 }, res => resolve(res.statusCode >= 200 && res.statusCode < 400))
    .on('error', () => resolve(false))
    .on('timeout', function() { this.destroy(); resolve(false); });
});

async function main() {
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  // Fetch all products
  let allProducts = [], page = 1, total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(API + '/home/admin/products?page=' + page + '&pageSize=100', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    if (allProducts.length >= total || list.length === 0) break;
    page++;
  }
  console.log('Loaded ' + allProducts.length + ' products');

  // Build image URLs
  const entries = allProducts.map(p => ({
    id: p._id,
    name: (p.name || p.title || '?').substring(0, 60),
    url: p.images?.[0] || ''
  }));
  const valid = entries.filter(e => e.url);
  console.log('Checking ' + valid.length + ' image URLs...\n');

  // Scan with concurrency
  let completed = 0, broken = [];
  const run = async (items) => {
    const results = await Promise.all(items.map(e => urlExists(e.url).then(ok => ({ ...e, ok }))));
    for (const r of results) {
      completed++;
      if (!r.ok) {
        broken.push(r);
        console.log('BROKEN ' + r.id + ' ' + r.url.substring(0, 80) + ' | ' + r.name);
      }
      if (completed % 200 === 0) console.log('Progress: ' + completed + '/' + valid.length + ' (' + broken.length + ' broken)');
    }
  };

  for (let i = 0; i < valid.length; i += CONCURRENCY) {
    await run(valid.slice(i, i + CONCURRENCY));
  }

  console.log('\n=== Scan Complete ===');
  console.log('Total images checked: ' + completed);
  console.log('Broken: ' + broken.length);
  if (broken.length > 0) {
    console.log('\nBroken products:');
    broken.forEach(b => console.log('  ' + b.id + ' ' + b.url.substring(0, 100) + ' | ' + b.name));
  } else {
    console.log('All images are working!');
  }
}
main().catch(console.error);
