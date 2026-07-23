const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const http = require('http');
const https = require('https');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const SECRET = process.env.ASSETS_SECRET || 'assets123';
const TARGET = process.env.RENDER_URL || 'https://lazada-backend-1.onrender.com';

function collectFiles(dir) {
  const files = [];
  const categoryDir = path.join(dir, 'category');
  if (fs.existsSync(categoryDir)) {
    for (const e of fs.readdirSync(categoryDir)) {
      files.push(path.join(categoryDir, e));
    }
  }
  const bannersDir = path.join(dir, 'banners');
  if (fs.existsSync(bannersDir)) {
    for (const e of fs.readdirSync(bannersDir)) {
      files.push(path.join(bannersDir, e));
    }
  }
  const piDir = path.join(dir, 'product_images');
  if (fs.existsSync(piDir)) {
    for (const e of fs.readdirSync(piDir)) {
      if (e.startsWith('hot_') || e.startsWith('find_')) {
        files.push(path.join(piDir, e));
      }
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
  const files = collectFiles(UPLOADS_DIR);
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
