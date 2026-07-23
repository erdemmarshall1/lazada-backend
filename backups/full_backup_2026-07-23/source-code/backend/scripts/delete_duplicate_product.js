/**
 * delete_duplicate_product.js
 *
 * Logs in as admin, then deletes the duplicate product
 * (the one with 0 sales, higher price — keep the one with sales)
 */
const https = require('https');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const KEEP_ID = '6a38e5aa847311abe21252c1';
const DELETE_ID = '6a39058e6aaf77e11b2680e6';

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
  console.log('Login OK, token:', token?.slice(0, 20) + '...');

  console.log(`\nDeleting duplicate product: ${DELETE_ID}...`);
  const delRes = await postJSON(`${API}/home/admin/delete-product`,
    { productId: DELETE_ID }, token
  );
  if (delRes.code !== 0) {
    console.error('Delete failed:', delRes.msg);
    process.exit(1);
  }
  console.log('Delete OK:', delRes.msg);
  console.log(`\nKept: ${KEEP_ID}`);
  console.log('Done.');
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
