const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 60000 }, (res) => {
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

const uploadOne = (p) => new Promise(resolve => {
  const imgUrl = IMG_SOURCE + '/uploads/product_images/' + p._id + '.jpg';
  cloudinary.uploader.upload(imgUrl, {
    public_id: 'products/' + p._id,
    overwrite: true,
    timeout: 20000,
  }).then(r => resolve({ p, url: r.secure_url }))
    .catch(e => resolve({ p, error: e.message }));
});

async function main() {
  console.log('Logging in...');
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
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
  console.log('Total: ' + all.length);

  const toUpload = all.filter(p => p.images?.[0]?.startsWith('/uploads/') && !p.images[0].includes('res.cloudinary.com'));
  console.log('Products to upload: ' + toUpload.length);

  const updates = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < toUpload.length; i++) {
    const result = await uploadOne(toUpload[i]);
    if (result.url) {
      updates.push({ productId: result.p._id, images: [result.url] });
      ok++;
    } else {
      fail++;
      if (fail <= 10) console.log(`  FAIL ${result.p._id}: ${result.error}`);
    }
    if ((i + 1) % 100 === 0) console.log(`  ${i+1}/${toUpload.length}: ${ok} OK, ${fail} failed`);

    if (updates.length >= 50) {
      try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token); }
      catch (e) {}
    }
  }

  if (updates.length > 0) {
    try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token); } catch (e) {}
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed`);
}

main().catch(console.error);
