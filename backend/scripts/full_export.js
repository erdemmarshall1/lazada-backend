const fs = require('fs');
const path = require('path');
const https = require('https');

const SOURCE_API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const PROJECT_ROOT = path.join(__dirname, '..', '..');
const PRODUCTS_JSON = path.join(PROJECT_ROOT, 'products_with_images.json');
const EXTRACTED_JSON = path.join(PROJECT_ROOT, 'extracted_products.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error('HTTP ' + res.statusCode));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(dest, Buffer.concat(chunks));
        resolve(dest);
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function getTotalProducts() {
  const buf = await fetch(SOURCE_API + '/main/goods/getSearchList?pageSize=1&page=1');
  const data = JSON.parse(buf.toString());
  return data?.data?.total || 0;
}

async function getAllProducts() {
  const total = await getTotalProducts();
  console.log('Total products on source: ' + total);
  const buf = await fetch(SOURCE_API + '/main/goods/getSearchList?pageSize=100&page=1');
  const data = JSON.parse(buf.toString());
  return data?.data?.list || [];
}

async function downloadImage(imagePath, destPath) {
  if (!imagePath) return false;
  try {
    await downloadFile(SOURCE_API + imagePath, destPath);
    const stat = fs.statSync(destPath);
    console.log('  ' + path.basename(destPath) + ' (' + (stat.size / 1024).toFixed(1) + ' KB)');
    return true;
  } catch (err) {
    console.error('  FAILED ' + imagePath + ': ' + err.message);
    return false;
  }
}

async function main() {
  console.log('=== Exporting products from source website ===');

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  const products = await getAllProducts();
  if (products.length === 0) {
    console.error('No products fetched from source!');
    process.exit(1);
  }

  console.log('\nProcessing ' + products.length + ' products...');

  const oldFiles = fs.readdirSync(UPLOADS_DIR).filter(f => /^product_\d+\.png$/.test(f));
  for (const f of oldFiles) {
    fs.unlinkSync(path.join(UPLOADS_DIR, f));
  }
  console.log('Cleared ' + oldFiles.length + ' old product images\n');

  const exported = [];
  const extracted = [];
  const batchSize = 20;

  for (let start = 0; start < products.length; start += batchSize) {
    const end = Math.min(start + batchSize, products.length);
    const batch = products.slice(start, end);
    console.log('Downloading batch ' + (start + 1) + '-' + end + '...');

    await Promise.all(batch.map(async (p, idx) => {
      const i = start + idx;
      const primaryImage = p.images && p.images.length > 0 ? p.images[0] : null;
      let localImage = null;
      if (primaryImage) {
        const remoteFilename = path.basename(primaryImage);
        const localPath = path.join(UPLOADS_DIR, remoteFilename);
        const ok = await downloadImage(primaryImage, localPath);
        if (ok) localImage = '/uploads/' + remoteFilename;
      }

      const price = p.skus && p.skus.length > 0 ? p.skus[0].price : p.minPrice || 0;
      const originalPrice = p.skus && p.skus.length > 0 ? p.skus[0].originalPrice : p.originalPrice || 0;

      exported.push({
        Name: p.name,
        Price: price,
        OriginalPrice: originalPrice,
        imageFile: localImage || '/uploads/product_' + i + '.png',
        description: p.description || '',
        categoryId: p.categoryId,
      });

      extracted.push({
        index: i,
        name: p.name,
        price: price,
        originalPrice: originalPrice,
        imageFile: localImage || '/uploads/product_' + i + '.png',
        description: p.description,
      });
    }));
  }

  fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(exported, null, 2));
  console.log('\nSaved ' + exported.length + ' products to products_with_images.json');

  fs.writeFileSync(EXTRACTED_JSON, JSON.stringify(extracted, null, 2));
  console.log('Saved ' + extracted.length + ' products to extracted_products.json');

  console.log('\nRegenerating seeder...');
  const { execSync } = require('child_process');
  try {
    execSync('node backend/scripts/generate_seeder.js', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    console.log('Seeder regenerated successfully!');
  } catch (err) {
    console.error('Failed to regenerate seeder:', err.message);
  }

  console.log('\n=== Export complete ===');
  console.log('  Products: ' + exported.length);
  console.log('  Images: ' + exported.filter(p => p.imageFile).length);
  console.log('  Output: ' + PRODUCTS_JSON);
  console.log('  Output: ' + EXTRACTED_JSON);
}

main().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
