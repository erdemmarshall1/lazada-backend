const https = require('https');

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

async function main() {
  const API = 'https://supportive-delight-production-b90c.up.railway.app';
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  const data = await getJSON(API + '/home/admin/products?page=1&pageSize=3', token);
  const products = data?.data?.list || [];

  for (const p of products) {
    console.log('Product ID:', p._id);
    console.log('Name:', (p.name || p.title || '?').substring(0, 80));
    console.log('Images array:');
    (p.images || []).forEach((img, i) => {
      console.log(`  [${i}] "${img}" (length: ${img.length})`);
    });
    console.log('');
  }
}

main().catch(console.error);
