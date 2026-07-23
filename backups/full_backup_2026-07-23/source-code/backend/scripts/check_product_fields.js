const https = require('https');
const ADMIN_API = 'https://supportive-delight-production-b90c.up.railway.app';

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const json = JSON.stringify(data);
  const req = https.request(url, { method: 'POST', headers: {'Content-Type':'application/json','Content-Length':Buffer.byteLength(json)}, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
  });
  req.on('error', reject); req.on('timeout', function() { this.destroy(); reject(); });
  req.write(json); req.end();
});
const getJSON = (url, token) => new Promise((resolve, reject) => {
  https.get(url, { headers: {'Authorization':'Bearer '+token}, timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({}); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(); });
});

async function main() {
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  // Get page 1 products to check full fields
  const data = await getJSON(ADMIN_API + '/home/admin/products?page=1&pageSize=200', token);
  const list = data?.data?.list || [];

  const missing = list.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  console.log('Missing from page 1: ' + missing.length + '\n');

  // Check all keys of a couple
  const p = missing[0];
  console.log('All keys for ' + p._id + ':');
  console.log(Object.keys(p).join(', '));

  // Check if there are any sourceUrl, externalLink, url, etc.
  const searchKeys = ['source', 'url', 'link', 'external', 'amazon', 'ebay', 'ali', 'shop'];
  for (const key of searchKeys) {
    const matches = Object.keys(p).filter(k => k.toLowerCase().includes(key));
    if (matches.length > 0) {
      matches.forEach(k => {
        console.log('  ' + k + ': ' + JSON.stringify(p[k]).substring(0, 200));
      });
    }
  }

  // Also check raw data
  console.log('\nFull keys that might have URLs:');
  p.allKeys = p;
  const urlKeys = Object.keys(p).filter(k => typeof p[k] === 'string' && (p[k].includes('http') || p[k].includes('www')));
  console.log('URL-containing string fields:');
  urlKeys.forEach(k => console.log('  ' + k + ': ' + p[k].substring(0, 150)));

  console.log('\nFull raw product (first missing):');
  Object.keys(p).forEach(k => {
    const v = p[k];
    if (typeof v === 'string') console.log('  ' + k + ': ' + v.substring(0, 200));
    else if (typeof v === 'object') console.log('  ' + k + ': [type=' + (Array.isArray(v) ? 'array(' + v.length + ')' : 'object') + ']');
    else console.log('  ' + k + ': ' + v);
  });
}

main();
