const cloudinary = require('cloudinary').v2;
const https = require('https');

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
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

// Map of image filename -> S3 URL from download_scraped_assets.js
const IMG_MAP = {
  'hot_1.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/cb5b085803ee068e68b648e8566f9132.jpg',
  'hot_2.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/7a7834988fd1ed8f57535387a3c8f8e1.jpg',
  'hot_3.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/9b73c85bf743ccf2bcc41f7b9d4b6c66.jpg',
  'hot_4.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/63643de35b1dae22567b302ee502cd2a.jpg',
  'hot_5.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d5347c08930ce57700abe5ab97f7f0ae.jpg',
  'hot_6.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/fe45c51aef0bc98b018b115e16b9e896.jpg',
  'hot_7.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/78d45192b7c69df7d60dd73ceeb9ffc7.jpg',
  'hot_8.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/5dd4f594cd02603f383e6f0883f9f390.jpg',
  'hot_9.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/3764d60300236f65fc3dcab9a397459b.jpg',
  'hot_10.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/3d3fca6c6042dc9725ce946df7897fc8.jpg',
  'hot_11.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/794d23e5265294c26072e9484e538f1b.jpg',
  'hot_12.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/4d21a6e24dc21f3bd5b4b5b8875e73e9.jpg',
  'hot_13.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/4ea6622d7e887e8a40c0bef45a53a9b1.jpg',
  'hot_14.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/9109092f2cd9f6b905734e19bf53f845.jpg',
  'hot_15.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/90b5af6ce71601a254e73a9b481857f4.jpg',
  'hot_16.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/1222a040cf8af7c1c0e77cb3759fd099.jpg',
  'hot_17.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d3b5d1fb2e95a15985e63b1559e1a6a3.jpg',
  'hot_18.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/d355394eb9fe4e96eb432f12e5995d6f.jpg',
  'find_1.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/9defde99b61b45181974f3017f6062de.jpg',
  'find_2.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260130/42d4008fd30c55448b3c83a97a3eea72.jpg',
  'find_3.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/b8f1fba95d281c243caf05dc004eed8f.jpg',
  'find_4.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260128/dff286fa14ac7d26ccb1a50980c3ca5b.jpg',
  'find_5.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260203/255c2a7a650c7e0976a529df9b73824b.jpg',
  'find_6.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/c85e389c4b511e4ea123e3bd1945a45e.jpg',
  'find_7.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/a5dd11f81ddabd89d0c4d58411fb63c6.jpg',
  'find_8.jpg': 'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/31995010f1681f1ceeae9c47eeb16864.jpg',
  'find_9.jpg': 'https://s3.popularity1.shop/tikiproduct/product/65b727b5b22c6/990-990/rh01914eu-38-cm-pearlised-baking-tray-non-stick-baking-sheet-carbon-steel-bpapfoa-free-silicone-handles-strong-durable-kitchen-cookware-for.jpg',
  'find_10.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260131/ca13818c525ad0112cfd76e4d444e4a9.jpg',
  'find_11.jpg': 'https://s3.popularity1.shop/tikiproduct/static/men-Accessories/49c8d9fd02de134e27fea205529fcdb7.jpg',
  'find_12.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Bags/7e0d8d87d5a7a75b99c6f659d1c9d7c2.jpg',
  'find_13.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260128/6715255a30b362f55c2808d2ba150758.jpg',
  'find_14.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260131/e754c0379681e4bb80354d848ba8124e.jpg',
  'find_15.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260128/e43e8ff0180a85e0831030a9350770eb.jpg',
  'find_16.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/175d53ed17d053ef9c23db1ec0306e98.jpg',
  'find_17.jpg': 'https://s3.popularity1.shop/tikiproduct/uploads/20260201/dff23770e6a1631c8f078aa02cbf619f.jpg',
  'find_18.jpg': 'https://s3.popularity1.shop/tikiproduct/static/men-Bags/a9bd25b86be0c22c91e6d7779162fb37.jpg',
  'find_19.jpg': 'https://s3.popularity1.shop/tikiproduct/product/65b824df63d54/990-990/iphone-15-128gb.jpg',
  'find_20.jpg': 'https://s3.popularity1.shop/tikiproduct/static/women-Accessories/cd9aba03329969a2f4811a6cc6da6856.jpg',
};

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

  // Find products whose image filename matches our map
  const toUpload = all.filter(p => {
    if (!p.images?.[0]?.startsWith('/uploads/')) return false;
    const match = p.images[0].match(/product_images\/(.+)$/);
    return match && IMG_MAP[match[1]];
  });
  console.log('Found ' + toUpload.length + ' products with known S3 URLs');

  let ok = 0, fail = 0;
  const updates = [];

  for (let i = 0; i < toUpload.length; i++) {
    const p = toUpload[i];
    const match = p.images[0].match(/product_images\/(.+)$/);
    const s3Url = IMG_MAP[match[1]];

    try {
      const result = await cloudinary.uploader.upload(s3Url, {
        public_id: 'products/' + p._id,
        overwrite: true,
        timeout: 15000,
      });
      updates.push({ productId: p._id, images: [result.secure_url] });
      ok++;
    } catch (err) {
      fail++;
      console.log(`  FAIL ${p._id}: ${err.message}`);
    }

    if ((i + 1) % 10 === 0) console.log(`  ${i+1}/${toUpload.length}: ${ok} OK, ${fail} failed`);
    if (updates.length >= 50) {
      try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: updates.splice(0, 50) }, token); }
      catch (e) { console.log('DB error: ' + e.message); }
    }
  }

  if (updates.length > 0) {
    try { await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token); } catch (e) {}
  }

  console.log(`\nDone: ${ok} uploaded, ${fail} failed`);
}

main().catch(console.error);
