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

const checkUrl = (url) => new Promise((resolve) => {
  if (!url || !url.startsWith('http')) return resolve(false);
  https.get(url, { timeout: 8000 }, (res) => {
    resolve(res.statusCode >= 200 && res.statusCode < 400);
  }).on('error', () => resolve(false)).on('timeout', function() { this.destroy(); resolve(false); });
});

async function main() {
  const r = await postJSON(ADMIN_API + '/main/sendMsg/login', {username:'admin',password:'admin123'});
  const token = r?.data?.token;
  if (!token) { console.log('Login failed'); return; }

  let all = [], page = 1, total = Infinity;
  while (all.length < total) {
    const data = await getJSON(ADMIN_API + '/home/admin/products?page=' + page + '&pageSize=200', token);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    all = all.concat(list);
    if (all.length >= total || list.length === 0) break;
    page++;
  }

  const totalProducts = all.length;
  const local = all.filter(p => p.images?.[0]?.startsWith('/uploads/'));
  const cloudinary = all.filter(p => p.images?.[0]?.includes('res.cloudinary.com'));
  const external = all.filter(p => p.images?.[0] && !p.images[0].startsWith('/') && !p.images[0].includes('res.cloudinary.com'));
  const noImage = all.filter(p => !p.images?.[0]);

  console.log(`Total products: ${totalProducts}`);
  console.log(`Cloudinary: ${cloudinary.length}`);
  console.log(`Local paths: ${local.length}`);
  console.log(`External URLs: ${external.length}`);
  console.log(`No image: ${noImage.length}`);
  console.log('');

  // Check a sample of local images
  const toCheck = local.slice(0, 50);
  let working = 0, broken = 0;
  for (const p of toCheck) {
    const url = ADMIN_API + p.images[0];
    const ok = await checkUrl(url);
    if (ok) working++; else broken++;
    if (!ok) console.log(`BROKEN: ${p._id} ${p.name?.slice(0,40)} -> ${url}`);
  }
  console.log(`\nSampled ${toCheck.length} local images: ${working} working, ${broken} broken`);

  if (broken > 0) {
    console.log(`\nEstimated ${Math.round(broken/toCheck.length * local.length)} local images may be broken`);
  }
}

main().catch(console.error);
