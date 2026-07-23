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

  // Get all products
  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(ADMIN_API + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }

  const cloudinary = all.filter(p => p.images?.[0]?.includes('res.cloudinary.com'));
  const local = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  const external = all.filter(p => p.images?.[0] && !p.images[0].startsWith('/') && !p.images[0].includes('res.cloudinary.com'));
  const none = all.filter(p => !p.images?.[0]);

  console.log('Cloudinary URLs: ' + cloudinary.length);
  console.log('Local paths: ' + local.length + ' (still need upload)');
  console.log('External URLs: ' + external.length);
  console.log('No image: ' + none.length);

  if (local.length > 0) {
    console.log('\nSample local paths:');
    local.slice(0, 5).forEach(p => console.log('  ' + p._id + ' ' + (p.images?.[0] || '')));
  }
}

main();
