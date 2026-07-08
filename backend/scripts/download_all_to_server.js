const https = require('https');
const API = 'https://lazada-backend-production-3b57.up.railway.app';

const postJSON = (url, data, extraHeaders) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json), ...extraHeaders };
  const req = https.request(url, { method: 'POST', headers, timeout: 600000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); } });
  });
  req.on('error', reject); req.on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  req.write(json); req.end();
});

async function main() {
  console.log('Logging in...');
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed', JSON.stringify(r).slice(0, 200)); return; }
  console.log('Token obtained');

  const getJSON = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': 'Bearer ' + token }, timeout: 15000 }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d }); } });
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  });

  // Count external-image products
  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(API + '/home/admin/products?page=' + page + '&pageSize=200');
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }
  console.log('Total products: ' + all.length);
  const external = all.filter(p => p.images?.[0] && !p.images[0].startsWith('/'));
  console.log('Products with external image URLs: ' + external.length);

  if (external.length === 0) { console.log('No external images to download.'); return; }

  console.log('Calling /home/admin/fix-images to download all external images to server...');
  const result = await postJSON(API + '/home/admin/fix-images', {}, { 'Authorization': 'Bearer ' + token });
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
