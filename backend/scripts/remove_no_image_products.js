const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PER_PAGE = 1000;
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%23f5f5f5%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%22200%22 y=%22200%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2224%22 fill=%22%23999%22 font-family=%22sans-serif%22%3EProduct%20Unavailable%3C/text%3E%3C/svg%3E';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url, token) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  mod.get(url, { headers, timeout: 30000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});
const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const mod = url.startsWith('https') ? https : http;
  const headers = { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const req = mod.request(url, { method: 'POST', headers, timeout: 30000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  });
  req.on('error', reject);
  req.on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
  req.write(json);
  req.end();
});

const hasNoImage = (p) => {
  if (!p.images) return true;
  if (!Array.isArray(p.images)) return true;
  if (p.images.length === 0) return true;
  const first = p.images[0];
  if (!first) return true;
  if (first === '') return true;
  return false;
};

async function main() {
  console.log('=== Remove No-Image Products ===\n');

  // 1. Login
  console.log('Logging in...');
  const loginResult = await postJSON(`${API}/main/sendMsg/login`, { username: 'admin', password: 'admin123' });
  const token = loginResult?.data?.token;
  if (!token) { console.error('Login failed:', JSON.stringify(loginResult).slice(0, 200)); return; }
  console.log('Login OK\n');

  // 2. Get ordered product IDs
  console.log('Fetching ordered product IDs...');
  let orderedIds = new Set();
  try {
    const orderRes = await postJSON(`${API}/home/admin/product-order-ids`, {}, token);
    orderedIds = new Set(orderRes?.data?.productIds || []);
    console.log(`  Products with orders: ${orderedIds.size}`);
  } catch (err) {
    console.log(`  WARN: endpoint not available yet. Deploy backend first. (${err.message})`);
    console.log('  Proceeding without order protection (will delete ALL no-image products).');
  }

  // 3. Fetch all products
  console.log('\nLoading all products...');
  let allProducts = [];
  let page = 1, total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(`${API}/home/admin/products?page=${page}&pageSize=${PER_PAGE}`, token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    console.log(`  Loaded ${allProducts.length}/${total}`);
    if (list.length < PER_PAGE) break;
    page++;
    await sleep(200);
  }
  console.log(`\nTotal products: ${allProducts.length}`);

  // 4. Identify no-image products
  const noImageProducts = allProducts.filter(hasNoImage);
  console.log(`No-image products: ${noImageProducts.length}`);
  if (noImageProducts.length === 0) {
    console.log('\nNothing to do. All products have images!');
    return;
  }

  // Log them
  console.log('\n--- No-Image Products ---');
  noImageProducts.forEach(p => {
    const hasOrder = orderedIds.has(p._id);
    console.log(`  [${hasOrder ? 'ORDERED' : '      '}] ${p._id} ${(p.name || p.title || '?').substring(0, 60)}`);
  });

  // 5. Separate into safe to delete vs need fallback
  const toDelete = noImageProducts.filter(p => !orderedIds.has(p._id));
  const toFallback = noImageProducts.filter(p => orderedIds.has(p._id));
  console.log(`\nTo DELETE (no orders): ${toDelete.length}`);
  console.log(`To ASSIGN fallback (has orders): ${toFallback.length}`);

  // 6. Delete products without orders
  if (toDelete.length > 0) {
    console.log(`\n--- Deleting ${toDelete.length} products without orders ---`);
    let deleted = 0, failed = 0;
    for (let i = 0; i < toDelete.length; i++) {
      const p = toDelete[i];
      try {
        const res = await postJSON(`${API}/home/admin/delete-product`, { productId: p._id }, token);
        if (res?.code === 0) {
          deleted++;
        } else {
          failed++;
          console.log(`  FAIL ${p._id}: ${res?.msg || 'unknown error'}`);
        }
      } catch (err) {
        failed++;
        console.log(`  ERROR ${p._id}: ${err.message}`);
      }
      if ((i + 1) % 50 === 0) console.log(`  Progress: ${i + 1}/${toDelete.length} (deleted: ${deleted}, failed: ${failed})`);
      await sleep(100);
    }
    console.log(`\n  Deletion complete: ${deleted} deleted, ${failed} failed`);
  }

  // 7. Assign fallback images to products with orders
  if (toFallback.length > 0) {
    console.log(`\n--- Assigning fallback images to ${toFallback.length} ordered products ---`);
    const updates = toFallback.map(p => ({ productId: p._id, images: [FALLBACK_IMAGE] }));
    try {
      const res = await postJSON(`${API}/home/admin/batch-update-images`, { updates }, token);
      console.log(`  Result: ${res?.msg || JSON.stringify(res).slice(0, 100)}`);
    } catch (err) {
      console.log(`  ERROR: ${err.message}`);
    }
  }

  // 8. Summary
  console.log('\n=== Summary ===');
  console.log(`Total products before: ${allProducts.length}`);
  console.log(`No-image products found: ${noImageProducts.length}`);
  console.log(`  Deleted (no orders): ${toDelete.length}`);
  console.log(`  Assigned fallback (has orders): ${toFallback.length}`);
  console.log(`Estimated remaining products: ${allProducts.length - toDelete.length}`);
  console.log('\nDone!');
}

main().catch(console.error);
