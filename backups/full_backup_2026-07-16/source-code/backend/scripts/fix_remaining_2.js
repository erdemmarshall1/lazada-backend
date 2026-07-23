const https = require('https');
const cloudinary = require('cloudinary').v2;

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';

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

async function main() {
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  const p1 = await getJSON(ADMIN_API + '/home/admin/products?page=1&pageSize=200', token);
  const all = p1?.data?.list || [];
  const needFix = all.filter(p => !(p.images?.[0] || '').includes('res.cloudinary.com'));

  if (needFix.length === 0) {
    const check = await getJSON(ADMIN_API + '/home/admin/products?page=1&pageSize=200', token);
    const list = check?.data?.list || [];
    const remaining = list.filter(p => !(p.images?.[0] || '').includes('res.cloudinary.com'));
    console.log(`Remaining non-Cloudinary: ${remaining.length}`);
    return;
  }

  console.log(`Fixing ${needFix.length} products...`);
  const updates = [];

  for (const p of needFix) {
    const img = p.images?.[0] || '';
    const relPath = img.replace(/^\//, '');
    const imgUrl = IMG_SOURCE + '/' + relPath;
    try {
      const result = await cloudinary.uploader.upload(imgUrl, {
        public_id: 'products/' + p._id,
        overwrite: true,
        timeout: 20000,
      });
      updates.push({ productId: p._id, images: [result.secure_url] });
      console.log(`  OK ${p._id}`);
    } catch (e) {
      console.log(`  FAIL ${p._id}: ${e.message}`);
    }
  }

  if (updates.length > 0) {
    const result = await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token);
    console.log('DB update:', result?.code === 0 ? 'SUCCESS' : 'FAILED', result?.msg || '');
  }
}

main().catch(console.error);