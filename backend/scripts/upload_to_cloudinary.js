const cloudinary = require('cloudinary').v2;
const https = require('https');
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';
const API = 'https://supportive-delight-production-b90c.up.railway.app';

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

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

async function main() {
  console.log('Logging in...');
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed:', JSON.stringify(r).slice(0, 200)); return; }
  console.log('Logged in');

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
  console.log('Total products: ' + all.length);

  // Filter products with local images
  const local = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Products with local images to upload: ' + local.length);

  const updates = [];
  let ok = 0, fail = 0, skipped = 0;

  for (let i = 0; i < local.length; i++) {
    const p = local[i];
    const localPath = p.images[0];
    const imageUrl = IMG_SOURCE + localPath;
    const publicId = 'products/' + p._id;
    const name = (p.name || p.title || '?').substring(0, 50);

    // Skip if already a Cloudinary URL
    if (localPath.includes('res.cloudinary.com')) { skipped++; continue; }

    try {
      const result = await cloudinary.uploader.upload(imageUrl, {
        public_id: publicId,
        overwrite: true,
        timeout: 60000,
      });
      const cloudinaryUrl = result.secure_url;
      updates.push({ productId: p._id, images: [cloudinaryUrl] });
      ok++;
      if (ok % 100 === 0 || ok === local.length || i === local.length - 1) {
        console.log(`Progress: ${i+1}/${local.length} uploaded (${ok} OK, ${fail} failed)`);
      }
    } catch (err) {
      fail++;
      console.log(`FAIL ${p._id} ${name}: ${err.message}`);
    }
  }

  console.log(`\nUpload complete: ${ok} OK, ${fail} failed, ${skipped} skipped`);
  console.log('Updating DB with Cloudinary URLs via batch-update-images...');

  // Update in batches of 50
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    try {
      const result = await postJSON(API + '/home/admin/batch-update-images', { updates: batch }, token);
      console.log(`Batch ${i/50 + 1}: ${result?.msg || JSON.stringify(result).slice(0, 100)}`);
    } catch (err) {
      console.log(`Batch ${i/50 + 1} error: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
