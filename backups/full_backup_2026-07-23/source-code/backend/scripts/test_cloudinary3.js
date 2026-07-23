const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const https = require('https');
const API = 'https://supportive-delight-production-b90c.up.railway.app';
const IMG_SOURCE = 'https://lazada-backend-production-3b57.up.railway.app';

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const req = https.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) }, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  });
  req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  req.write(json); req.end();
});

async function main() {
  // Login to get a test product's image
  const r = await postJSON(API + '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  const getJSON = (url) => new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Authorization': 'Bearer ' + token }, timeout: 15000 }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
    }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  });

  // Get first 3 products
  const data = await getJSON(API + '/home/admin/products?page=1&pageSize=3');
  const products = data?.data?.list || [];

  for (const p of products) {
    const localPath = p.images?.[0] || '';
    const imgUrl = IMG_SOURCE + localPath;
    console.log(`\nProduct: ${p._id}`);
    console.log(`DB path: ${localPath}`);
    console.log(`Full URL: ${imgUrl}`);

    // Test fetch
    try {
      const html = await new Promise((resolve, reject) => {
        https.get(imgUrl, { timeout: 10000 }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve({ status: res.statusCode, type: res.headers['content-type'], len: d.length }));
        }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
      });
      console.log(`Fetch: status=${html.status}, type=${html.type}, size=${html.len}`);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(imgUrl, {
        public_id: 'test/' + p._id,
        overwrite: true,
        timeout: 30000,
      });
      console.log(`Cloudinary: ${result.secure_url}`);
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
