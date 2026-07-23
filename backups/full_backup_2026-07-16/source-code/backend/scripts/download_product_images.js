const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://the-outnet-backend-production-3b57.up.railway.app';
const OUTPUT_DIR = path.join(__dirname, '..', 'uploads', 'product_images');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const fetchJson = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
  }).on('error', reject);
});

const downloadImage = (url, dest) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
    if (res.statusCode !== 200) {
      reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      return;
    }
    const ext = path.extname(new URL(url).pathname).split('?')[0] || '.jpg';
    const filePath = `${dest}${ext}`;
    const file = fs.createWriteStream(filePath);
    res.pipe(file);
    file.on('finish', () => { file.close(); resolve(filePath); });
  }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
});

const getExt = (url) => {
  try {
    const p = new URL(url).pathname;
    const e = path.extname(p).split('?')[0].toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(e)) return e;
    return '.jpg';
  } catch { return '.jpg'; }
};

async function main() {
  console.log('Fetching all products from API...');
  const allImages = [];
  let page = 1, total = 0;
  while (true) {
    const res = await fetchJson(`${API_BASE}/main/goods/getSearchList?page=${page}&pageSize=50`);
    const list = res?.data?.list || [];
    if (list.length === 0) break;
    for (const p of list) {
      if (p.images?.[0] && p.images[0].startsWith('http')) {
        allImages.push({ id: p._id, url: p.images[0] });
      }
    }
    total += list.length;
    console.log(`  Page ${page}: ${list.length} products (${allImages.length} need downloads)`);
    page++;
    if (list.length < 50) break;
  }

  console.log(`\nTotal products: ${total}, Images to download: ${allImages.length}`);
  let downloaded = 0, failed = 0;

  for (const item of allImages) {
    const dest = path.join(OUTPUT_DIR, item.id);
    if (fs.existsSync(dest + '.jpg') || fs.existsSync(dest + '.png') || fs.existsSync(dest + '.webp')) {
      console.log(`  SKIP ${item.id} (already exists)`);
      downloaded++;
      continue;
    }
    try {
      const filePath = await downloadImage(item.url, dest);
      console.log(`  OK ${item.id} → ${path.basename(filePath)}`);
      downloaded++;
    } catch (err) {
      console.log(`  FAIL ${item.id}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Downloaded: ${downloaded}, Failed: ${failed}`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
