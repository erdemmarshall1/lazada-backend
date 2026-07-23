const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';

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
  console.log('Loading scraped_details.json...');
  const scrapedPath = path.join(__dirname, 'scraped_details.json');
  const scrapeData = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  const origMap = new Map();
  for (const p of scrapeData) {
    const key = `${p.mer_id || '0'}_${p.product_id}`;
    const imgUrl = p.images?.find(i => i && i.startsWith('http')) || p.image;
    if (imgUrl) origMap.set(key, imgUrl);
  }
  console.log(`Loaded ${origMap.size} original image URLs from scraped_details.json`);

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
  console.log('Missing from Cloudinary: ' + toUpload.length);

  const updates = [];
  let ok = 0, fail = 0, noOrig = 0;

  for (let i = 0; i < toUpload.length; i++) {
    const p = toUpload[i];
    const origUrl = origMap.get(p.originalId);

    if (!origUrl) {
      noOrig++;
      if (noOrig <= 5) console.log(`  NO_ORIG ${p._id}: originalId=${p.originalId}`);
      fail++;
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(origUrl, {
        public_id: 'products/' + p._id,
        overwrite: true,
        timeout: 15000,
      });
      updates.push({ productId: p._id, images: [result.secure_url] });
      ok++;
    } catch (err) {
      fail++;
      if (fail <= 10) console.log(`  FAIL ${p._id}: ${err.message}`);
    }

    if ((i + 1) % 100 === 0) console.log(`  ${i+1}/${toUpload.length}: ${ok} OK, ${fail} failed (${noOrig} no origUrl)`);
    if (updates.length >= 50) {
      try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token); }
      catch (e) { console.log('DB error: ' + e.message); }
    }
  }

  if (updates.length > 0) {
    try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token); } catch (e) {}
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed (${noOrig} had no original URL)`);
}

main().catch(console.error);
