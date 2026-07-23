const https = require('https');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';
const PRODUCTS_DIR = path.join(__dirname, '..', '..', 'Products');

cloudinary.config({
  cloud_name: 'u7xxu5dq',
  api_key: '726627823236327',
  api_secret: 'qJmfLkCQ-wvbAhx6RQcf4MCVBUE',
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

const cleanName = (str) =>
  str.toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\.transform\..*/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/['',.!?&\/\\#@$%^&*+=<>:;"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const cleanFilename = (filename) => {
  const name = path.parse(filename).name;
  return cleanName(name);
};

const getWords = (str) => str.split(/\s+/).filter(w => w.length > 2);

const hasDescriptiveWords = (str) => getWords(str).length >= 2;

const isWholeWordMatch = (word, textWords) =>
  textWords.some(tw => tw === word);

const scoreMatch = (filename, productName) => {
  const fn = cleanFilename(filename);
  const pn = cleanName(productName);

  if (fn === pn) return 100;

  const fnWords = getWords(fn);
  const pnWords = getWords(pn);

  if (fnWords.length === 0 || pnWords.length === 0) return 0;

  if (fn.length > 3) {
    if (fn === pn) return 100;
    const pnStr = pnWords.join(' ');
    if (pnStr.includes(fn)) return 95;
    if (fnWords.every(w => isWholeWordMatch(w, pnWords))) return 95;
  }

  let matches = 0;
  for (const fw of fnWords) {
    if (isWholeWordMatch(fw, pnWords)) {
      matches++;
    }
  }

  const denominator = Math.max(fnWords.length, pnWords.length);
  const score = Math.round((matches / denominator) * 100);

  if (hasDescriptiveWords(fn) && score > 20) {
    const pctOfFilename = Math.round((matches / fnWords.length) * 100);
    return Math.max(score, pctOfFilename);
  }

  return score;
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

async function getAllProducts(token) {
  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(ADMIN_API + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }
  return all;
}

async function main() {
  console.log('Logging in...');
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  console.log('Fetching all products...');
  const all = await getAllProducts(token);
  console.log(`Total products: ${all.length}`);

  let cloud = 0, local = 0, external = 0, none = 0;
  for (const p of all) {
    const img = p.images?.[0] || '';
    if (img.includes('res.cloudinary.com')) cloud++;
    else if (img.startsWith('/uploads/') || img.startsWith('/assets/')) local++;
    else if (img) external++;
    else none++;
  }
  console.log(`Cloudinary: ${cloud} | Local: ${local} | External: ${external} | None: ${none}`);

  const folderFiles = fs.readdirSync(PRODUCTS_DIR).filter(f => /\.(webp|jpg|jpeg|png|avif|jfif)$/i.test(f));
  console.log(`\nProducts folder: ${folderFiles.length} images`);

  const descriptive = folderFiles.filter(f => hasDescriptiveWords(cleanFilename(f)));
  console.log(`Descriptive: ${descriptive.length} | Cryptic: ${folderFiles.length - descriptive.length}`);

  const matches = [];
  for (const file of folderFiles) {
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
    if (bestScore >= 30 && bestProduct) {
      matches.push({ file, productId: bestProduct._id, productName: bestProduct.name, score: bestScore });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  console.log(`\nMatched (>=30): ${matches.length}`);

  if (matches.length > 0) {
    console.log('=== Top matches ===');
    matches.slice(0, 30).forEach(m =>
      console.log(`  ${String(m.score).padStart(3)}% | ${m.file.padEnd(60)} -> ${m.productName?.slice(0, 60)}`)
    );
    if (matches.length > 30) {
      console.log(`  ... and ${matches.length - 30} more`);
      matches.slice(-10).forEach(m =>
        console.log(`  ${String(m.score).padStart(3)}% | ${m.file.padEnd(60)} -> ${m.productName?.slice(0, 60)}`)
      );
    }
  }

  const highConf = matches.filter(m => m.score >= 50);
  const mediumConf = matches.filter(m => m.score >= 30 && m.score < 50);
  console.log(`\n=== Upload phase ===`);
  console.log(`High confidence (>=50%): ${highConf.length}`);
  console.log(`Medium confidence (30-50%): ${mediumConf.length}`);

  const updates = [];
  let ok = 0, fail = 0;

  const uploadBatch = async (list, label) => {
    for (const m of list) {
      const filePath = path.join(PRODUCTS_DIR, m.file);
      try {
        const cloudUrl = await uploadToCloudinary(filePath, m.productId);
        updates.push({ productId: m.productId, images: [cloudUrl] });
        console.log(`  ${label} OK ${m.file.padEnd(55)} ${m.productName?.slice(0, 40)}`);
        ok++;
      } catch (e) {
        console.log(`  ${label} FAIL ${m.file}: ${e.message}`);
        fail++;
      }
    }
  };

  console.log('\nUploading high confidence matches...');
  await uploadBatch(highConf, 'HIGH');

  if (mediumConf.length > 0) {
    console.log('\nUploading medium confidence matches...');
    await uploadBatch(mediumConf, 'MED ');
  }

  console.log(`\nUploaded: ${ok} | Failed: ${fail}`);

  if (updates.length > 0) {
    console.log(`\nUpdating ${updates.length} products in DB...`);
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      const result = await postJSON(ADMIN_API + '/home/admin/batch-update-images', { updates: batch }, token);
      console.log(`  Batch ${Math.floor(i/50) + 1}: ${result?.code === 0 ? 'OK' : 'FAIL'} (${batch.length} products)`);
    }
  }

  console.log('\nAll done!');
}

main().catch(console.error);
