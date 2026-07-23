/**
 * fix_remaining.js — Apply Pixabay images to ALL products
 */
const https = require('https');
const path = require('path');
const LOG = require('../../product_match_log.json');

const API = 'https://supportive-delight-production-b90c.up.railway.app';

function req(url, opts) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opt = {
      hostname: u.hostname, port: 443, path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { 'User-Agent': 'fix/1.0', ...(opts.headers || {}) },
      timeout: 30000,
    };
    const r = https.request(opt, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({error: d.slice(0,200)}); } });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (opts.body) r.write(opts.body);
    r.end();
  });
}

async function main() {
  // 1. Login
  const login = await req(API + '/main/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({username:'admin', password:'admin123'}),
  });
  const token = login.data?.token;
  if (!token) { console.error('Login failed:', JSON.stringify(login).slice(0,200)); process.exit(1); }
  console.log('Login OK');

  // 2. Fetch all products
  const all = [];
  for (let p = 1; p <= 10; p++) {
    const r = await req(API + '/main/goods/getSearchList?page=' + p + '&pageSize=100', { headers: { token } });
    if (r.data?.list) { all.push(...r.data.list); console.log('Page', p, ':', r.data.list.length); if (r.data.list.length < 100) break; }
    else { console.log('Page', p, 'response:', JSON.stringify(r).slice(0,200)); break; }
  }
  console.log('Total:', all.length);

  // 3. Build map from log
  const map = {};
  LOG.forEach(e => { if (e.productId && e.uploadedPath) map[e.productId] = e.uploadedPath; });
  console.log('Mapped products:', Object.keys(map).length);

  // 4. Build updates
  const updates = [];
  let genericIdx = 0;
  for (const p of all) {
    if (map[p._id]) {
      updates.push({ productId: p._id, images: [map[p._id]] });
    } else {
      updates.push({ productId: p._id, images: ['/uploads/product_' + (genericIdx % 100) + '.png'] });
      genericIdx++;
    }
  }
  console.log('Updates to send:', updates.length);

  // 5. Apply in batches
  for (let i = 0; i < updates.length; i += 20) {
    const batch = updates.slice(i, i + 20);
    const r = await req(API + '/home/admin/batch-update-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', token },
      body: JSON.stringify({ updates: batch }),
    });
    const ok = r.data?.ok || r.data?.updated || 0;
    console.log('Batch ' + ((i / 20) + 1) + ': sent ' + batch.length + ' ok=' + ok);
    // Small delay
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDONE');
}

main().catch(e => console.error('Fatal:', e));
