const https = require('https');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const MATCH_LOG = path.join(__dirname, '..', '..', 'product_match_log.json');

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = {'Content-Type':'application/json','Content-Length':Buffer.byteLength(json)};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 30000 }, (res) => {
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

const uploadUrlToCloudinary = (imageUrl, publicId) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload(imageUrl, {
    public_id: 'products/' + publicId,
    overwrite: true,
    timeout: 20000,
  }, (err, result) => {
    if (err) reject(err);
    else resolve(result.secure_url);
  });
});

async function main() {
  const matchLog = JSON.parse(fs.readFileSync(MATCH_LOG, 'utf8'));
  const pixabayMap = new Map();
  for (const entry of matchLog) {
    if (!pixabayMap.has(entry.productId)) {
      pixabayMap.set(entry.productId, entry.pixabayUrl);
    }
  }
  console.log(`Pixabay match log: ${matchLog.length} entries, ${pixabayMap.size} unique products`);

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
  console.log(`Total products: ${all.length}`);

  const needFix = all.filter(p => {
    const img = p.images?.[0] || '';
    return !img.includes('res.cloudinary.com');
  });
  console.log(`Products needing image fix: ${needFix.length}`);

  const withPixabayMatch = needFix.filter(p => pixabayMap.has(p._id));
  const withoutMatch = needFix.filter(p => !pixabayMap.has(p._id));
  console.log(`Have Pixabay reference: ${withPixabayMatch.length}`);
  console.log(`No Pixabay reference: ${withoutMatch.length}`);

  if (withPixabayMatch.length === 0) {
    console.log('No products to fix via Pixabay.');
    return;
  }

  console.log('\nUploading Pixabay images to Cloudinary...');
  const updates = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < withPixabayMatch.length; i++) {
    const p = withPixabayMatch[i];
    const pixUrl = pixabayMap.get(p._id);
    try {
      const cloudUrl = await uploadUrlToCloudinary(pixUrl, p._id);
      updates.push({ productId: p._id, images: [cloudUrl] });
      ok++;
    } catch (e) {
      fail++;
      if (fail <= 5) console.log(`  FAIL ${p._id}: ${e.message}`);
    }
    if ((i + 1) % 50 === 0) {
      console.log(`  ${i+1}/${withPixabayMatch.length}: ${ok} OK, ${fail} failed`);
    }
  }

  console.log(`\nUpload results: ${ok} OK, ${fail} failed`);

  if (updates.length > 0) {
    console.log(`\nUpdating ${updates.length} products in DB...`);
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      const result = await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: batch }, token);
      console.log(`  Batch ${Math.floor(i/50) + 1}: ${result?.code === 0 ? 'OK' : 'FAIL'} (${batch.length})`);
    }
  }

  console.log('\nAll done!');
}

main().catch(console.error);
