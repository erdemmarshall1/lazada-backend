const https = require('https');
const API = 'https://lazada-backend-production-3b57.up.railway.app';

const urlExists = (url) => new Promise(resolve => {
  if (!url) return resolve(false);
  const absUrl = url.startsWith('http') ? url : API + url;
  https.get(absUrl, { method: 'HEAD', timeout: 10000 }, res => {
    let ok = res.statusCode >= 200 && res.statusCode < 400;
    if (ok) resolve(true);
    else { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(false)); }
  }).on('error', () => resolve(false)).on('timeout', function() { this.destroy(); resolve(false); });
});

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
  https.get(url, { headers: token ? { 'Authorization': 'Bearer ' + token } : {}, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

async function main() {
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  // Get all products
  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(API + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }
  console.log('Total: ' + all.length);

  // Check image paths
  const local = all.filter(p => p.images?.[0]?.startsWith('/'));
  const external = all.filter(p => p.images?.[0] && !p.images[0].startsWith('/'));
  const noImage = all.filter(p => !p.images?.[0]);
  console.log('Local paths: ' + local.length + ', External URLs: ' + external.length + ', No image: ' + noImage.length);

  if (external.length > 0) {
    console.log('\nProducts still with external URLs:');
    external.forEach(p => console.log('  ' + p._id + ' ' + (p.images[0] || '').substring(0, 80)));
  }

  // Spot-check random local images
  console.log('\nSpot-checking 50 local images...');
  const samples = local.sort(() => Math.random() - 0.5).slice(0, 50);
  let ok = 0, bad = 0;
  for (const p of samples) {
    const exists = await urlExists(p.images[0]);
    if (!exists) { bad++; console.log('  MISSING: ' + p._id + ' ' + p.images[0] + ' | ' + (p.name || p.title || '').substring(0, 50)); }
    else ok++;
  }
  console.log('Spot check: ' + ok + ' OK, ' + bad + ' missing');
}

main().catch(console.error);
