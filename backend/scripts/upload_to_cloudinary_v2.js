const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';
const CONCURRENCY = 20;

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 30000 }, (res) => {
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
  const url = IMG_SOURCE + '/uploads/product_images/' + id + '.jpg';
  https.get(url, { timeout: 8000 }, (res) => {
    let d = '';
    res.on('data', c => { d += c; if (d.length > 50) res.destroy(); });
    res.on('end', () => { resolve((res.headers['content-type'] || '').startsWith('image/')); });
  }).on('error', () => resolve(false)).on('timeout', function() { this.destroy(); resolve(false); });
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

  const local = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Local image products: ' + local.length);

  // Pre-check availability with concurrency
  console.log('\nChecking image availability...');
  let available = [], missing = [], checked = 0;
  for (let i = 0; i < local.length; i += CONCURRENCY) {
    const batch = local.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(p => isRealImage(p._id).then(ok => ({ p, ok }))));
    for (const r of results) {
      if (r.ok) available.push(r.p);
      else missing.push(r.p);
    }
    checked += batch.length;
    if (checked % 500 === 0 || checked === local.length) {
      console.log(`  Checked ${checked}/${local.length}: ${available.length} OK, ${missing.length} missing`);
    }
  }
  console.log(`\nAvailable: ${available.length}, Missing: ${missing.length}`);

  if (missing.length > 0) {
    fs.writeFileSync('missing_images.json', JSON.stringify(missing.map(p => ({ _id: p._id })), null, 2));
    console.log(`Saved missing list to missing_images.json`);
  }

  // Upload to Cloudinary + update DB in batches
  console.log(`\nUploading ${available.length} images to Cloudinary...`);
  const updates = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < available.length; i++) {
    const p = available[i];
    const imgUrl = IMG_SOURCE + '/uploads/product_images/' + p._id + '.jpg';

    try {
      const result = await cloudinary.uploader.upload(imgUrl, {
        public_id: 'products/' + p._id,
        overwrite: true,
        timeout: 20000,
      });
      updates.push({ productId: p._id, images: [result.secure_url] });
      ok++;
    } catch (err) {
      fail++;
      missing.push(p);
    }

    if (ok % 200 === 0 || i === available.length - 1) {
      console.log(`  Upload: ${i+1}/${available.length} (${ok} OK, ${fail} failed)`);
    }

    // Batch-update DB every 50
    if (updates.length >= 50) {
      try {
        await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token);
      } catch (err) {
        console.log(`DB batch update error: ${err.message}`);
      }
    }
  }

  // Flush remaining updates
  if (updates.length > 0) {
    try {
      await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token);
    } catch (err) {
      console.log(`DB final batch error: ${err.message}`);
    }
  }

  console.log(`\nFinal: ${ok} uploaded to Cloudinary, ${missing.length} need alternative fix`);
  console.log('Done!');
}

main().catch(console.error);
