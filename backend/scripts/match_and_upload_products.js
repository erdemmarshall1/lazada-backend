const https = require('https');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const PRODUCTS_DIR = path.join(__dirname, '..', '..', 'Products');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'u7xxu5dq',
  api_key: process.env.CLOUDINARY_API_KEY || '726627823236327',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const headers = {'Content-Type':'application/json','Content-Length':Buffer.byteLength(json)};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const req = https.request(url, { method: 'POST', headers, timeout: 15000 }, (res) => {
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

// Score how well a filename matches a product name
const scoreMatch = (filename, productName) => {
  const fn = path.parse(filename).name.toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\(\d+\)/g, '')
    .replace(/\.transform\..*/g, '')
    .trim();
  const pn = productName.toLowerCase();

  // Exact match
  if (fn === pn) return 100;
  // Filename contains product name or vice versa
  if (fn.includes(pn) || pn.includes(fn)) return 90;

  const fnWords = fn.split(/\s+/).filter(w => w.length > 2);
  const pnWords = pn.split(/\s+/).filter(w => w.length > 2);

  if (fnWords.length === 0 || pnWords.length === 0) return 0;

  let matches = 0;
  for (const fw of fnWords) {
    for (const pw of pnWords) {
      if (fw === pw || fw.includes(pw) || pw.includes(fw)) {
        matches++;
        break;
      }
    }
  }

  return Math.round((matches / Math.max(fnWords.length, pnWords.length)) * 100);
};

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
  // Login to admin API
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  // Get all products
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

  // Index Products/ folder
  const folderFiles = fs.readdirSync(PRODUCTS_DIR).filter(f => /\.(webp|jpg|jpeg|png|avif|jfif)$/i.test(f));
  console.log(`Products folder: ${folderFiles.length} images\n`);

  const matches = [];
  const unmatched = [];

  for (const file of folderFiles) {
    const filePath = path.join(PRODUCTS_DIR, file);
    let bestScore = 0;
    let bestProduct = null;

    for (const p of all) {
      if (p.name) {
        const score = scoreMatch(file, p.name);
        if (score > bestScore) {
          bestScore = score;
          bestProduct = p;
        }
      }
    }

    if (bestScore >= 40 && bestProduct) {
      matches.push({ file, productId: bestProduct._id, productName: bestProduct.name, score: bestScore });
    } else {
      unmatched.push(file);
    }
  }

  console.log(`Matched: ${matches.length}`);
  console.log(`Unmatched: ${unmatched.length}\n`);

  if (matches.length > 0) {
    console.log('=== Best matches ===');
    matches.sort((a, b) => b.score - a.score).slice(0, 20).forEach(m =>
      console.log(`  ${m.score}% | ${m.file.padEnd(60)} -> ${m.productName?.slice(0,60)}`)
    );
  }

  if (unmatched.length > 0) {
    console.log(`\n=== Sample unmatched (${Math.min(10, unmatched.length)}) ===`);
    unmatched.slice(0, 10).forEach(f => console.log(`  ${f}`));
  }

  const highConfidence = matches.filter(m => m.score >= 80);
  console.log(`\n=== Upload phase (${highConfidence.length} matches >= 80%) ===`);

  const updates = [];
  for (const m of highConfidence) {
    const filePath = path.join(PRODUCTS_DIR, m.file);
    try {
      const cloudUrl = await uploadToCloudinary(filePath, m.productId);
      updates.push({ productId: m.productId, images: [cloudUrl] });
      console.log(`  OK ${m.file.padEnd(55)} ${m.productName?.slice(0,40)}`);
    } catch (e) {
      console.log(`  FAIL ${m.file}: ${e.message}`);
    }
  }

  if (updates.length > 0) {
    console.log(`\nUpdating ${updates.length} products in DB...`);
    const result = await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates }, token);
    console.log('DB update:', result?.code === 0 ? 'SUCCESS' : 'FAILED', result?.msg || '');
  }

  console.log('\nDone!');
}

main().catch(console.error);
