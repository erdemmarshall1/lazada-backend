const https = require('https');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getJSON(url, token) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    https.get(url, { headers, timeout: 15000 }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });
}

function postJSON(url, data) {
  return new Promise((resolve, reject) => {
    const json = JSON.stringify(data);
    const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }, timeout: 15000 }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
    });
    req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
    req.write(json); req.end();
  });
}

function headExists(url) {
  return new Promise(resolve => {
    https.get(url, { method: 'HEAD', timeout: 10000 }, res => {
      let ok = res.statusCode >= 200 && res.statusCode < 400;
      resolve(ok);
    }).on('error', () => resolve(false)).on('timeout', function() { this.destroy(); resolve(false); });
  });
}

async function checkBackend(label, url) {
  console.log(`\n========== ${label} ==========`);
  console.log(`URL: ${url}`);

  const r = await postJSON(url + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('LOGIN FAILED'); return; }
  console.log('Login OK');

  // Get product stats
  const p1 = await getJSON(url + '/home/admin/products?page=1&pageSize=5', token);
  console.log('Total products: ' + (p1?.data?.total || '?'));
  
  const all = [];
  let page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(url + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all.push(...list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }
  console.log('Loaded: ' + all.length);

  const external = all.filter(p => p.images?.[0] && !p.images[0].startsWith('/'));
  const local = all.filter(p => p.images?.[0]?.startsWith('/'));
  const none = all.filter(p => !p.images?.[0]);
  console.log(`External URLs: ${external.length}, Local paths: ${local.length}, No image: ${none.length}`);

  if (external.length > 0) {
    console.log('Sample external URLs:');
    external.slice(0, 3).forEach(p => console.log(`  ${p._id}: ${(p.images[0] || '').substring(0, 100)}`));
  }

  // Check a few local images
  if (local.length > 0) {
    const samples = local.slice(0, 5);
    console.log('Checking 5 local images:');
    for (const p of samples) {
      const imgUrl = p.images[0];
      const absUrl = imgUrl.startsWith('http') ? imgUrl : url + imgUrl;
      const ok = await headExists(absUrl);
      console.log(`  ${ok ? 'OK' : 'MISSING'} ${absUrl.substring(0, 100)}`);
    }
  }
}

async function main() {
  await checkBackend('SUPPORTIVE-DELIGHT', 'https://supportive-delight-production-b90c.up.railway.app');
  await checkBackend('LAZADA-BACKEND', 'https://lazada-backend-production-3b57.up.railway.app');
}

main().catch(console.error);
