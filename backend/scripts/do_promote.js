const https = require('https');

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'setup/1.0' },
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
  const res = await postJSON('https://lazada-backend-production-3b57.up.railway.app/home/admin/promote-admin', {
    secret: 'SCRAPE_SETUP_2026',
    email: 'admin_wholesale@shopify.com',
  });
  console.log(JSON.stringify(res, null, 2));
};

main().catch(err => console.error(err.message));
