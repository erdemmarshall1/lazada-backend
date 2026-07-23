const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const http = require('http');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SECRET = process.env.ASSETS_SECRET || 'assets123';
const TARGET = process.env.RENDER_URL || 'https://lazada-backend-1.onrender.com';

const patterns = [
  'product_images/hot_*.jpg',
  'product_images/find_*.jpg',
  'category/*.png',
  'banners/*.jpg',
  'product.png',
];

function collectFiles(dir, patterns) {
  const files = [];
  for (const p of patterns) {
    const [subdir, glob] = p.includes('*') ? [path.dirname(p), path.basename(p)] : [path.dirname(p), path.basename(p)];
    const fullDir = path.join(dir, subdir || '');
    if (!fs.existsSync(fullDir)) continue;
    const entries = fs.readdirSync(fullDir);
    const re = new RegExp('^' + glob.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
    for (const e of entries) {
      if (re.test(e)) files.push(path.join(fullDir, e));
    }
  }
  return files;
}

async function createZip(files) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const archive = archiver('zip', { zlib: { level: 6 } });
    archive.on('data', c => chunks.push(c));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    for (const f of files) {
      const relative = path.relative(UPLOADS_DIR, f);
      archive.file(f, { name: relative });
    }
    archive.finalize();
  });
}

function uploadZip(zipBuffer) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${TARGET}/api/upload-assets?secret=${SECRET}`);
    const boundary = '----' + Date.now();
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="zip"; filename="assets.zip"\r\nContent-Type: application/zip\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, zipBuffer, footer]);

    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(opts, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  const files = collectFiles(UPLOADS_DIR, patterns);
  console.log(`Found ${files.length} files to upload`);
  if (files.length === 0) {
    console.log('No files found. Check UPLOADS_DIR:', UPLOADS_DIR);
    process.exit(1);
  }

  console.log('Creating zip...');
  const zip = await createZip(files);

  console.log(`Zip size: ${(zip.length / 1024 / 1024).toFixed(2)} MB`);

  console.log(`Uploading to ${TARGET}...`);
  const result = await uploadZip(zip);

  console.log(`Response ${result.status}: ${result.body}`);
  if (result.status === 200) {
    console.log('Assets uploaded successfully!');
  } else {
    process.exit(1);
  }
})();
