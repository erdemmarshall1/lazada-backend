/**
 * remove_duplicates.js
 *
 * Fetches ALL products from Railway, groups by exact name match,
 * keeps the one with highest salesCount, deletes the rest.
 */
const https = require('https');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: {
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const main = async () => {
  console.log('Logging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('Fetching all products (paginated)...');
  const all = [];
  let page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    all.push(...list);
    console.log(`  Page ${page}: ${list.length} products (total: ${all.length})`);
    page++;
  }
  console.log(`Total products fetched: ${all.length}`);

  const seenIds = new Set();
  const unique = [];
  for (const p of all) {
    if (!seenIds.has(p._id)) {
      seenIds.add(p._id);
      unique.push(p);
    }
  }
  if (unique.length < all.length) {
    console.log(`Removed ${all.length - unique.length} pagination duplicates`);
  }

  const groups = {};
  for (const p of unique) {
    const name = (p.name || '').trim().toLowerCase();
    if (!name) continue;
    if (!groups[name]) groups[name] = [];
    groups[name].push(p);
  }

  let totalDeleted = 0;
  let groupsFound = 0;

  for (const [name, products] of Object.entries(groups)) {
    if (products.length < 2) continue;
    groupsFound++;
    products.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
    const keep = products[0];
    const toDelete = products.slice(1);

    console.log(`\nDuplicate group #${groupsFound}: "${name.slice(0, 60)}..."`);
    console.log(`  Keep:     ${keep._id} (sales: ${keep.salesCount || 0})`);
    for (const d of toDelete) {
      console.log(`  Deleting: ${d._id} (sales: ${d.salesCount || 0})...`);
      const delRes = await postJSON(`${API}/home/admin/delete-product`,
        { productId: d._id }, token
      );
      if (delRes.code === 0) {
        totalDeleted++;
        console.log(`    OK`);
      } else {
        console.log(`    FAIL: ${delRes.msg}`);
      }
    }
  }

  console.log(`\n========================`);
  console.log(`Duplicate groups found: ${groupsFound}`);
  console.log(`Products deleted:       ${totalDeleted}`);
  console.log(`========================`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
