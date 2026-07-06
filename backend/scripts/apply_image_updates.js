/**
 * apply_image_updates.js
 *
 * Logs in with your admin credentials, then posts the Pixabay image
 * mapping to the batch-update endpoint on Railway.
 *
 * Usage — set the password as an environment variable (secure, not stored):
 *   $env:ADMIN_PASSWORD="your_password"; node scripts/apply_image_updates.js
 *
 * Or pass as command-line argument (visible in process list):
 *   node scripts/apply_image_updates.js your_password
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const MAP_FILE = path.join(__dirname, '..', 'product_image_updates.json');

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname,
    port: u.port || 443,
    path: u.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      'User-Agent': 'apply-script/1.0',
    },
    timeout: 60000,
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const req = https.request(opts, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`Bad JSON: ${data.slice(0,200)}`)); }
    });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const main = async () => {
  console.log('Product Image Update Tool');
  console.log('═'.repeat(40));

  // 1. Get password from env var or CLI arg
  const password = process.env.ADMIN_PASSWORD || process.argv[2];
  if (!password) {
    console.error('No password provided.');
    console.error('Usage: $env:ADMIN_PASSWORD="your_password"; node scripts/apply_image_updates.js');
    process.exit(1);
  }

  // 2. Login
  console.log('Logging in...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password });
  if (loginRes.code !== 0 || !loginRes.data?.token) {
    console.error('Login failed:', loginRes.msg || 'Unknown error');
    process.exit(1);
  }
  const token = loginRes.data.token;
  console.log('Login OK');

  // 3. Read mapping file
  console.log('Reading mapping file...');
  if (!fs.existsSync(MAP_FILE)) {
    console.error(`Mapping file not found: ${MAP_FILE}`);
    console.error('Run scrape_product_images.js first');
    process.exit(1);
  }
  const mapping = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  if (!mapping.updates || mapping.updates.length === 0) {
    console.error('No updates in mapping file');
    process.exit(1);
  }
  console.log(`Loaded ${mapping.updates.length} product image updates`);

  // 4. Apply updates
  console.log('Applying updates...');
  const result = await postJSON(`${API}/home/admin/batch-update-images`, { updates: mapping.updates }, token);
  console.log('Result:', JSON.stringify(result, null, 2));
  if (result.code === 0) {
    console.log('✓ Success:', result.msg);
  } else {
    console.log('✗ Error:', result.msg);
  }
};

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
