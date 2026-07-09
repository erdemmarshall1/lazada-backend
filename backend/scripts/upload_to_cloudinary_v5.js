const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
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
  const headers = { 'Authorization': 'Bearer ' + token };
  https.get(url, { headers, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
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

  const toUpload = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Local-path products: ' + toUpload.length);

  // Check what image filenames we're dealing with
  const uuidPaths = toUpload.filter(p => p.images[0].match(/\/uploads\/[a-f0-9-]+\.(webp|jpg|png|jpeg)/i));
  const productIdPaths = toUpload.filter(p => p.images[0].match(/\/uploads\/product_images\//));
  console.log('UUID-based paths: ' + uuidPaths.length);
  console.log('ProductId-based paths: ' + productIdPaths.length);

  let ok = 0, fail = 0;
  const updates = [];

  for (let i = 0; i < toUpload.length; i++) {
    const p = toUpload[i];
    const imgRelPath = p.images[0].replace(/^\//, ''); // remove leading /
    const imgUrl = IMG_SOURCE + '/' + imgRelPath;
    const publicId = 'products/' + p._id;

    try {
      const result = await cloudinary.uploader.upload(imgUrl, {
        public_id: publicId,
        overwrite: true,
        timeout: 20000,
      });
      updates.push({ productId: p._id, images: [result.secure_url] });
      ok++;
    } catch (err) {
      fail++;
      // Try fallback URL (product_images/ dir)
      if (!imgRelPath.startsWith('uploads/product_images/')) {
        try {
          const fallbackUrl = IMG_SOURCE + '/uploads/product_images/' + p._id + '.jpg';
          const result = await cloudinary.uploader.upload(fallbackUrl, {
            public_id: publicId,
            overwrite: true,
            timeout: 20000,
          });
          updates.push({ productId: p._id, images: [result.secure_url] });
          fail--; ok++;
        } catch (e2) {
          if (fail <= 10) console.log(`  FAIL ${p._id}: ${err.message} / ${e2.message}`);
        }
      } else {
        if (fail <= 10) console.log(`  FAIL ${p._id}: ${err.message}`);
      }
    }

    if ((i + 1) % 100 === 0) console.log(`  ${i+1}/${toUpload.length}: ${ok} OK, ${fail} failed`);
    if (updates.length >= 50) {
      try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token); }
      catch (e) { console.log('DB update error: ' + e.message); }
    }
  }

  if (updates.length > 0) {
    try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token); } catch (e) {}
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed`);
}

main().catch(console.error);
