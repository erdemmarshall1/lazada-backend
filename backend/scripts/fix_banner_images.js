/**
 * fix_banner_images.js
 *
 * Replaces ALL banner images with Pixabay images that directly match
 * each banner title. Tries multiple search queries per banner and
 * picks the best match. Uploads to Railway as local files.
 *
 * Run: node scripts/fix_banner_images.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://supportive-delight-production-b90c.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const TMP_DIR = path.join(__dirname, '..', '..', 'tmp_banners');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

let TOKEN = '';

function req(url, opts) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    opts = opts || {};
    const opt = {
      hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'fix-banners/1.0', ...(opts.headers || {}) },
      timeout: 30000,
    };
    const r = https.request(opt, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks), text: Buffer.concat(chunks).toString('utf8') }));
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (opts.body) r.write(typeof opts.body === 'string' ? opts.body : opts.body);
    r.end();
  });
}

function getJSON(url, token) {
  const headers = {};
  if (token) { headers.token = token; }
  return req(url, { headers }).then(r => { try { return JSON.parse(r.text); } catch { return null; } });
}

function postJSON(url, data, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) { headers.token = token; }
  return req(url, { method: 'POST', headers, body: JSON.stringify(data) }).then(r => {
    try { return JSON.parse(r.text); } catch { return { error: r.text.slice(0, 200) }; }
  });
}

async function login() {
  const r = await postJSON(API + '/main/user/login', { username: 'admin', password: 'admin123' });
  if (r.code === 0 && r.data?.token) { TOKEN = r.data.token; console.log('  Login OK'); }
  else throw new Error('Login failed: ' + JSON.stringify(r).slice(0, 200));
}

// Pixabay search — returns first image URL or null
function pixabaySearch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=5&order=popular&min_width=600&min_height=400`;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opt = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
      headers: { 'User-Agent': 'fix-banners/1.0' }, timeout: 15000,
    };
    const r = https.request(opt, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.totalHits > 0 && j.hits?.length > 0) {
            resolve(j.hits[0].webformatURL || j.hits[0].largeImageURL || null);
          } else resolve(null);
        } catch { resolve(null); }
      });
    });
    r.on('error', () => resolve(null));
    r.on('timeout', () => { r.destroy(); resolve(null); });
    r.end();
  });
}

function download(url) { return req(url).then(r => r.data); }

async function uploadToRailway(filePath) {
  const fileName = path.basename(filePath);
  const fileData = fs.readFileSync(filePath);
  const boundary = '----' + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext] || 'image/jpeg';
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mime}\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(header, 'utf8'), fileData, Buffer.from(footer, 'utf8')]);

  const r = await req(API + '/home/upload/file', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, token: TOKEN },
    body,
  });

  try {
    const j = JSON.parse(r.text);
    if (j.code === 0 || j.code === 200) return j.data?.url || j.data?.path || '/uploads/' + fileName;
    throw new Error('Upload failed: ' + (j.msg || r.text.slice(0, 100)));
  } catch (e) {
    throw new Error('Upload error: ' + e.message);
  }
}

async function main() {
  console.log('=== Fix Banner Images (title-matched) ===\n');

  // 1. Login
  console.log('1. Logging in...');
  await login();

  // 2. Fetch banners
  console.log('2. Fetching current banners...');
  const r = await getJSON(API + '/main/banner/getList', TOKEN);
  const banners = r?.data || [];
  if (!banners.length) { console.error('  No banners found'); process.exit(1); }
  console.log('  Found ' + banners.length + ' banners');

  // 3. Per-banner search queries (title-specific, multiple attempts)
  const bannerSearches = [
    {
      title: 'Summer Sale - Up to 70% Off',
      queries: ['shopping sale discount', 'summer sale promotion', 'shopping bag sale'],
    },
    {
      title: 'New Arrivals Fashion 2026',
      queries: ['fashion clothing style', 'clothing collection fashion', 'fashion model new collection'],
    },
    {
      title: 'Electronics Mega Deals',
      queries: ['electronics gadgets technology', 'smartphone laptop tech', 'electronics devices shopping'],
    },
    {
      title: 'Beauty & Skincare Special',
      queries: ['beauty skincare products', 'cosmetics makeup skincare', 'beauty products collection'],
    },
    {
      title: 'Sports & Outdoors Collection',
      queries: ['sports equipment fitness', 'outdoor sports exercise', 'fitness gym sports gear'],
    },
  ];

  console.log('\n3. Searching Pixabay and updating banners...');
  let updated = 0;
  let errors = 0;

  for (let i = 0; i < banners.length; i++) {
    const banner = banners[i];
    const searches = (bannerSearches[i] || bannerSearches[0]);
    console.log('\n  [' + (i + 1) + '/' + banners.length + '] ' + searches.title);

    let pixabayUrl = null;
    for (const query of searches.queries) {
      console.log('     Trying: ' + query);
      pixabayUrl = await pixabaySearch(query);
      if (pixabayUrl) {
        console.log('     Found: ' + pixabayUrl);
        break;
      }
    }

    if (!pixabayUrl) {
      console.log('     No Pixabay result for any query');
      errors++;
      continue;
    }

    try {
      // Download
      const ext = path.extname(new URL(pixabayUrl).pathname) || '.jpg';
      const tmpPath = path.join(TMP_DIR, 'banner_' + i + ext);
      const data = await download(pixabayUrl);
      if (data.length === 0) { console.log('     Download empty'); errors++; continue; }
      fs.writeFileSync(tmpPath, data);
      console.log('     Downloaded: ' + (data.length / 1024).toFixed(0) + ' KB');

      // Upload
      const uploadedPath = await uploadToRailway(tmpPath);
      console.log('     Uploaded: ' + uploadedPath);

      // Update banner record
      const upResult = await postJSON(API + '/home/admin/update-banners', {
        banners: [{ _id: banner._id, image: uploadedPath }],
      }, TOKEN);
      if (upResult.code === 0) {
        console.log('     Banner updated OK');
        updated++;
      } else {
        console.log('     Update failed: ' + JSON.stringify(upResult).slice(0, 100));
        errors++;
      }

      try { fs.unlinkSync(tmpPath); } catch {}
    } catch (e) {
      console.log('     ERROR: ' + e.message);
      errors++;
    }
  }

  // 4. Results
  console.log('\n=== Results ===');
  console.log('Updated: ' + updated + '/' + banners.length);
  console.log('Errors: ' + errors);

  // 5. Verify
  console.log('\n4. Verifying...');
  const v = await getJSON(API + '/main/banner/getList', TOKEN);
  if (v?.data) {
    for (const b of v.data) {
      const isLocal = b.image?.startsWith('/uploads/');
      console.log('  ' + (b.title || '').substring(0, 35).padEnd(38) + ' | ' + (isLocal ? 'LOCAL' : 'REMOTE').padEnd(8) + ' | ' + (b.image || '').slice(-25));
    }
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
