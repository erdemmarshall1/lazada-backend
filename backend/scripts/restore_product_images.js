const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PRODUCTS_DIR = path.join(__dirname, '..', '..', 'Products');
const CDN_JSON = path.join(__dirname, '..', '..', 'cdn_urls.json');
const PWI_JSON = path.join(__dirname, '..', '..', 'products_with_images.json');
const BACKUP_DIR = path.join(__dirname, '..', 'Lazada_Full_Backup_2026-06-26', 'uploads');
const LOG_FILE = path.join(__dirname, '..', '..', 'image_migration_log.json');

const ADMIN_USER = 'admin_wholesale';
const ADMIN_PASS = 'Admin@MQQYYI6G';

let TOKEN = '';

function request(url, opts, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const options = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: {
        'User-Agent': 'restore-script/1.0',
        token: TOKEN,
        'x-access-token': TOKEN,
        Authorization: `Bearer ${TOKEN}`,
        ...(opts.headers || {}),
      },
      timeout: 30000,
    };
    if (body) {
      options.headers['Content-Type'] = opts.contentType || 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch (e) { resolve({ status: res.statusCode, raw: data.slice(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function login() {
  const body = JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS });
  const r = await request(`${API}/main/user/login`, { method: 'POST', contentType: 'application/json' }, body);
  if (r.data && r.data.code === 0) {
    TOKEN = r.data.data.token;
    console.log('Login OK, token obtained');
  } else {
    throw new Error(`Login failed: ${JSON.stringify(r.data)}`);
  }
}

async function getAllProducts() {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const r = await request(`${API}/main/goods/getSearchList?page=${page}&pageSize=100`, { method: 'GET' });
    if (r.data && r.data.code === 0 && r.data.data && r.data.data.list) {
      all.push(...r.data.data.list);
      if (r.data.data.list.length < 100) break;
    } else {
      break;
    }
  }
  return all;
}

function normalize(str) {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getKeywords(str) {
  const words = normalize(str).split(/\s+/).filter(w => w.length > 2);
  const stopWords = new Set(['the', 'and', 'for', 'with', 'new', 'from', 'this', 'that', 'have', 'not',
    'are', 'was', 'but', 'all', 'can', 'has', 'its', 'our', 'you', 'your', 'size', 'color', 'inch']);
  return words.filter(w => !stopWords.has(w));
}

function scoreMatch(productName, imageName) {
  const pWords = getKeywords(productName);
  const iWords = getKeywords(imageName);
  if (pWords.length === 0 || iWords.length === 0) return 0;
  const common = pWords.filter(w => iWords.includes(w));
  const score = common.length / Math.max(pWords.length, iWords.length);
  const exactBrand = common.filter(w => w === iWords[0] || iWords.includes(w));
  const bonus = exactBrand.length > 0 ? 0.2 : 0;
  return score + bonus;
}

async function uploadImage(filePath) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  const boundary = '----' + Date.now().toString(36);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${getMimeType(filePath)}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(header, 'utf8'),
    fileData,
    Buffer.from(footer, 'utf8'),
  ]);

  const r = await request(`${API}/home/upload/file`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    },
  }, body);

  if (r.data && r.data.code === 0) {
    return r.data.data;
  }
  throw new Error(`Upload failed: ${JSON.stringify(r.data || r.raw)}`);
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
    '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
    '.jfif': 'image/jpeg',
  };
  return map[ext] || 'application/octet-stream';
}

async function batchUpdateImages(updates) {
  const body = JSON.stringify({ updates });
  const r = await request(`${API}/home/admin/batch-update-images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }, body);
  return r.data;
}

async function main() {
  console.log('=== Product Image Restoration Script ===');
  console.log();

  // Login
  console.log('1. Logging in as admin...');
  await login();
  console.log();

  // Get all products
  console.log('2. Fetching all products from DB...');
  const allProducts = await getAllProducts();
  console.log(`   Total products: ${allProducts.length}`);
  console.log();

  // Read Products/ folder
  console.log('3. Scanning Products/ folder...');
  let productImages = [];
  try {
    productImages = fs.readdirSync(PRODUCTS_DIR)
      .filter(f => /\.(webp|png|jpg|jpeg|avif|jfif|gif)$/i.test(f))
      .map(f => ({ name: f, path: path.join(PRODUCTS_DIR, f) }));
  } catch (e) {
    console.log(`   Products/ folder not found: ${e.message}`);
  }
  console.log(`   Found ${productImages.length} images`);
  console.log();

  // Read CDN URLs
  console.log('4. Loading CDN URL mappings...');
  let cdnMappings = [];
  try {
    cdnMappings = JSON.parse(fs.readFileSync(CDN_JSON, 'utf8'));
  } catch (e) {
    console.log(`   cdn_urls.json not found: ${e.message}`);
  }
  console.log(`   Found ${cdnMappings.length} CDN mappings`);
  console.log();

  // Read PWI mappings
  console.log('5. Loading products_with_images mappings...');
  let pwiMappings = [];
  try {
    pwiMappings = JSON.parse(fs.readFileSync(PWI_JSON, 'utf8'));
  } catch (e) {
    console.log(`   products_with_images.json not found: ${e.message}`);
  }
  console.log(`   Found ${pwiMappings.length} PWI mappings`);
  console.log();

  // Match products
  console.log('6. Matching products to images...');
  const matchLog = [];
  let matched = 0;
  let uploaded = 0;
  let updated = 0;

  for (const product of allProducts) {
    const prodName = normalize(product.name);
    const currentImages = product.images || [];

    // Skip products that already have good local upload images (not Pixabay)
    const hasLocalImage = currentImages.some(img =>
      typeof img === 'string' && img.startsWith('/uploads/') && !img.includes('pixabay')
    );
    if (hasLocalImage && !cdnMappings.some(m => normalize(m.name).includes(prodName))) {
      continue;
    }

    let bestMatch = null;
    let bestScore = 0.25;

    // Try matching against CDN URLs by checking if CDN name contains product name keywords
    const prodKeywords = getKeywords(product.name);
    for (const cdn of cdnMappings) {
      const cdnNorm = normalize(cdn.name);
      const matchCount = prodKeywords.filter(k => cdnNorm.includes(k)).length;
      if (matchCount >= 2) {
        bestMatch = { type: 'cdn', url: cdn.img, name: cdn.name, score: 0.5 + matchCount * 0.1 };
        bestScore = bestMatch.score;
        break;
      }
    }

    if (!bestMatch) {
      // Try matching against PWI images (reference /uploads/product_NN.png)
      for (const pwi of pwiMappings) {
        const pwiNorm = normalize(pwi.Name);
        const matchCount = prodKeywords.filter(k => pwiNorm.includes(k)).length;
        if (matchCount >= 2) {
          // Check if the image file exists in backup
          const imgFile = pwi.imageFile.replace('/uploads/', '');
          const backupPath = path.join(BACKUP_DIR, imgFile);
          if (fs.existsSync(backupPath)) {
            bestMatch = { type: 'local', path: backupPath, file: imgFile, name: pwi.Name, score: 0.5 + matchCount * 0.1 };
            bestScore = bestMatch.score;
          }
          break;
        }
      }
    }

    if (!bestMatch) {
      // Try matching against Products/ folder filenames
      for (const pi of productImages) {
        const imgName = path.parse(pi.name).name;
        const score = scoreMatch(product.name, imgName);
        if (score > bestScore) {
          bestMatch = { type: 'upload', path: pi.path, file: pi.name, name: imgName, score };
          bestScore = score;
        }
      }
    }

    if (bestMatch) {
      matched++;
      const entry = {
        productId: product._id,
        productName: product.name,
        matchType: bestMatch.type,
        matchName: bestMatch.name,
        score: bestScore,
      };

      try {
        if (bestMatch.type === 'cdn') {
          // CDN URL - directly update
          entry.newImages = [bestMatch.url];
          const batchResult = await batchUpdateImages([{ productId: product._id, images: [bestMatch.url] }]);
          if (batchResult && batchResult.code === 0) {
            updated++;
            entry.status = 'updated (cdn)';
          } else {
            entry.status = `batch update failed: ${JSON.stringify(batchResult)}`;
          }
        } else if (bestMatch.type === 'local' || bestMatch.type === 'upload') {
          // Upload the file
          const uploadResult = await uploadImage(bestMatch.path);
          if (uploadResult) {
            const uploadedPath = uploadResult.url || uploadResult.path || `/uploads/${bestMatch.file}`;
            uploaded++;
            entry.uploadedPath = uploadedPath;
            entry.newImages = [uploadedPath];
            const batchResult = await batchUpdateImages([{ productId: product._id, images: [uploadedPath] }]);
            if (batchResult && batchResult.code === 0) {
              updated++;
              entry.status = 'updated (uploaded)';
            } else {
              entry.status = `batch update failed: ${JSON.stringify(batchResult)}`;
            }
          } else {
            entry.status = `upload failed: no result`;
          }
        }
      } catch (e) {
        entry.status = `error: ${e.message}`;
      }
      matchLog.push(entry);

      if (matched % 10 === 0) {
        console.log(`   Matched ${matched}/${allProducts.length}, uploaded ${uploaded}, updated ${updated}`);
      }
    }
  }

  console.log();
  console.log('=== Results ===');
  console.log(`Total products: ${allProducts.length}`);
  console.log(`Matched: ${matched}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Updated: ${updated}`);

  // Save log
  fs.writeFileSync(LOG_FILE, JSON.stringify(matchLog, null, 2), 'utf8');
  console.log(`Log saved to ${LOG_FILE}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
