const https = require('https');
const fs = require('fs');
const path = require('path');
const HOST = 'lazada-backend-production-3b57.up.railway.app';
const PRODUCTS_DIR = path.join(__dirname, '..', '..', 'Products');

const request = (method, path, body, token, filePath) => new Promise((resolve, reject) => {
  if (filePath) {
    // Multipart upload
    const boundary = '----' + Date.now();
    const fsStat = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.jfif': 'image/jpeg' };
    const mime = mimeTypes[ext] || 'application/octet-stream';

    const header = Buffer.from('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + fileName + '"\r\nContent-Type: ' + mime + '\r\n\r\n');
    const footer = Buffer.from('\r\n--' + boundary + '--\r\n');
    const fileData = fs.readFileSync(filePath);
    const payload = Buffer.concat([header, fileData, footer]);

    const opts = {
      hostname: HOST, port: 443, path, method,
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': payload.length,
      },
      timeout: 30000,
    };
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ code: -1, msg: d }); } });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  } else {
    const data = body ? JSON.stringify(body) : '';
    const opts = {
      hostname: HOST, port: 443, path, method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ code: -1, msg: d }); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  }
});

async function main() {
  // 1. Login
  console.log('Logging in...');
  const loginRes = await request('POST', '/main/sendMsg/login', { username: 'admin', password: 'admin123' });
  if (!loginRes?.data?.token) { console.error('Login failed:', loginRes?.msg || JSON.stringify(loginRes).slice(0,200)); return; }
  const token = loginRes.data.token;
  console.log('Logged in');

  // 2. Get all product files sorted
  if (!fs.existsSync(PRODUCTS_DIR)) { console.error('Products directory not found:', PRODUCTS_DIR); return; }
  const files = fs.readdirSync(PRODUCTS_DIR)
    .filter(f => /\.(webp|jpg|jpeg|png|avif|jfif)$/i.test(f))
    .sort();
  console.log('Found', files.length, 'image files');

  // 3. Get all products
  console.log('Fetching products...');
  let allProducts = [];
  for (let p = 1; p <= 50; p++) {
    const res = await request('GET', '/main/goods/getSearchList?page=' + p + '&pageSize=100', null, null);
    const list = res?.data?.list || [];
    if (list.length === 0) break;
    allProducts = allProducts.concat(list);
  }
  console.log('Total products:', allProducts.length);

  // 4. Upload and assign
  const count = Math.min(files.length, allProducts.length);
  console.log('Processing', count, 'products...');
  for (let i = 0; i < count; i++) {
    const filePath = path.join(PRODUCTS_DIR, files[i]);
    const product = allProducts[i];
    
    // Upload file
    const uploadRes = await request('POST', '/home/upload/file', null, token, filePath);
    if (uploadRes?.code !== 0 || !uploadRes?.data?.url) {
      console.error('  Upload failed for', files[i], ':', uploadRes?.msg);
      continue;
    }
    const imageUrl = uploadRes.data.url;

    // Update product
    const updateRes = await request('POST', '/home/admin/update-product', { id: product._id, images: [imageUrl] }, token);
    if (updateRes?.code === 0) {
      console.log('  ' + (i + 1) + '/' + count + ' OK:', product.name.substring(0, 40) + '... -> ' + imageUrl);
    } else {
      console.error('  ' + (i + 1) + '/' + count + ' FAIL:', product.name.substring(0, 40) + ' - ' + (updateRes?.msg || 'error'));
    }
  }
  console.log('Done!');
}

main().catch(console.error);
