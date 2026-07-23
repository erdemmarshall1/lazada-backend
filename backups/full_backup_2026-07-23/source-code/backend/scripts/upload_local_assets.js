const https = require('https');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const LOCAL_ASSETS = path.join(__dirname, '..', '..', 'local_assets', 'product_images');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = {'Content-Type':'application/json','Content-Length':Buffer.byteLength(json)};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 60000 }, (res) => {
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

const uploadToCloudinary = (filePath, publicId) => new Promise((resolve, reject) => {
  cloudinary.uploader.upload(filePath, {
    public_id: 'products/' + publicId,
    overwrite: true,
  }, (err, result) => {
    if (err) reject(err);
    else resolve(result.secure_url);
  });
});

async function main() {
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

  const needFix = all.filter(p => !(p.images?.[0] || '').includes('res.cloudinary.com'));
  console.log(`Products needing image: ${needFix.length}`);

  const localFiles = new Map();
  for (const f of fs.readdirSync(LOCAL_ASSETS)) {
    const id = path.parse(f).name;
    if (!localFiles.has(id)) localFiles.set(id, f);
  }
  console.log(`Local asset files: ${localFiles.size}`);

  const matched = [];
  for (const p of needFix) {
    const cleanId = p._id.replace(/[^a-f0-9]/gi, '');
    for (const [fileId, filename] of localFiles) {
      if (fileId.startsWith(cleanId) || cleanId.startsWith(fileId)) {
        matched.push({ productId: p._id, filePath: path.join(LOCAL_ASSETS, filename) });
        break;
      }
    }
  }
  console.log(`Matched to local assets: ${matched.length}`);

  if (matched.length === 0) {
    console.log('No matches found. Trying by name prefix...');
    for (const p of needFix) {
      for (const [fileId, filename] of localFiles) {
        if (p._id.indexOf(fileId) !== -1 || fileId.indexOf(p._id) !== -1) {
          matched.push({ productId: p._id, filePath: path.join(LOCAL_ASSETS, filename) });
          break;
        }
      }
    }
    console.log(`Matched via loose search: ${matched.length}`);
  }

  if (matched.length > 0) {
    console.log('\nUploading matched local assets to Cloudinary...');
    const updates = [];
    let ok = 0, fail = 0;

    for (let i = 0; i < matched.length; i++) {
      const m = matched[i];
      try {
        const cloudUrl = await uploadToCloudinary(m.filePath, m.productId);
        updates.push({ productId: m.productId, images: [cloudUrl] });
        ok++;
      } catch (e) {
        fail++;
      }
      if ((i + 1) % 50 === 0) {
        console.log(`  ${i+1}/${matched.length}: ${ok} OK, ${fail} failed`);
      }
    }

    console.log(`\nUploaded: ${ok} | Failed: ${fail}`);

    if (updates.length > 0) {
      console.log(`\nUpdating ${updates.length} products in DB...`);
      for (let i = 0; i < updates.length; i += 50) {
        const batch = updates.slice(i, i + 50);
        const result = await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: batch }, token);
        console.log(`  Batch ${Math.floor(i/50) + 1}: ${result?.code === 0 ? 'OK' : 'FAIL'} (${batch.length})`);
      }
    }
  } else {
    console.log('No local asset matches found.');
  }

  console.log('\nDone!');
}

main().catch(console.error);