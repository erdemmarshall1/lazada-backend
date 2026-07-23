const https = require('https');
const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const req = https.request(url, { method: 'POST', headers: {'Content-Type':'application/json','Content-Length':Buffer.byteLength(json)}, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
  });
  req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(); });
  req.write(json); req.end();
});
const getJSON = (url, token) => new Promise((resolve, reject) => {
  https.get(url, { headers: {'Authorization':'Bearer '+token}, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(); });
});

async function main() {
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(ADMIN_API + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }

  const missing = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Missing from Cloudinary: ' + missing.length);

  // Show a few with their names/categories
  console.log('\nSample missing products:');
  const sample = missing.slice(0, 10);
  sample.forEach(p => {
    console.log('  ID: ' + p._id);
    console.log('  Name: ' + (p.productName || p.name || 'N/A'));
    console.log('  Category: ' + (p.categoryName || p.category || 'N/A'));
    console.log('  Image: ' + (p.images?.[0] || 'N/A'));
    console.log('');
  });

  // Unique categories
  const cats = [...new Set(missing.map(p => p.categoryName || p.category || '').filter(Boolean))];
  console.log('Categories (' + cats.length + '):');
  cats.forEach(c => console.log('  - ' + c));
}

main();
