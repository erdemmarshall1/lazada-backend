const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';
const CHECK_CONCURRENCY = 50;
const UPLOAD_CONCURRENCY = 5;

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

const isRealImage = (id) => new Promise(resolve => {
  https.get(IMG_SOURCE + '/uploads/product_images/' + id + '.jpg', { timeout: 8000 }, (res) => {
    let d = '';
    res.on('data', c => { d += c; if (d.length > 50) res.destroy(); });
    res.on('end', () => resolve((res.headers['content-type'] || '').startsWith('image/')));
  }).on('error', () => resolve(false)).on('timeout', function() { this.destroy(); resolve(false); });
});

const uploadOne = (p) => cloudinary.uploader.upload(
  IMG_SOURCE + '/uploads/product_images/' + p._id + '.jpg',
  { public_id: 'products/' + p._id, overwrite: true, timeout: 30000 }
).then(r => ({ p, url: r.secure_url })).catch(e => ({ p, error: e.message }));

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

  const local = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Local image products: ' + local.length);

  // Pre-check
  console.log('\nChecking image availability...');
  let available = [], missing = [];
  for (let i = 0; i < local.length; i += CHECK_CONCURRENCY) {
    const batch = local.slice(i, i + CHECK_CONCURRENCY);
    const results = await Promise.all(batch.map(p => isRealImage(p._id).then(ok => ({ p, ok }))));
    for (const r of results) {
      if (r.ok) available.push(r.p);
      else missing.push(r.p);
    }
    if ((i + CHECK_CONCURRENCY) % 1000 === 0 || i + CHECK_CONCURRENCY >= local.length) {
      console.log(`  Checked ${Math.min(i + CHECK_CONCURRENCY, local.length)}/${local.length}: ${available.length} OK, ${missing.length} missing`);
    }
  }
  console.log(`\nAvailable: ${available.length}, Missing: ${missing.length}`);

  if (missing.length > 0) {
    fs.writeFileSync('missing_images.json', JSON.stringify(missing.map(p => ({ _id: p._id })), null, 2));
  }

  // Upload with concurrency
  console.log(`\nUploading ${available.length} images to Cloudinary (concurrency=${UPLOAD_CONCURRENCY})...`);
  let ok = 0, fail = 0;
  const updates = [];

  for (let i = 0; i < available.length; i += UPLOAD_CONCURRENCY) {
    const batch = available.slice(i, i + UPLOAD_CONCURRENCY);
    const results = await Promise.all(batch.map(uploadOne));

    for (const r of results) {
      if (r.url) {
        updates.push({ productId: r.p._id, images: [r.url] });
        ok++;
      } else {
        fail++;
        missing.push(r.p);
        console.log(`  FAIL ${r.p._id}: ${r.error}`);
      }
    }

    if ((i + UPLOAD_CONCURRENCY) % 200 === 0 || i + UPLOAD_CONCURRENCY >= available.length) {
      console.log(`  Upload: ${Math.min(i + UPLOAD_CONCURRENCY, available.length)}/${available.length} (${ok} OK, ${fail} failed)`);
    }

    // DB batch update every 50
    if (updates.length >= 50) {
      try {
        await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token);
      } catch (err) {
        console.log(`DB update error: ${err.message}`);
      }
    }
  }

  if (updates.length > 0) {
    try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token); } catch (e) {}
  }

  if (missing.length > 0) {
    fs.writeFileSync('missing_images.json', JSON.stringify([...new Map(missing.map(p => [p._id, p]))].map(([_, p]) => ({ _id: p._id })), null, 2));
  }

  console.log(`\n=== Complete ===`);
  console.log(`Uploaded to Cloudinary: ${ok}`);
  console.log(`Failed/Missing: ${missing.length}`);
  console.log(`Cloudinary URLs saved to DB`);
}

main().catch(console.error);
