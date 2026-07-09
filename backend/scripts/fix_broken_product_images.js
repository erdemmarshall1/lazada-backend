const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';
const PLACEHOLDER = `${API}/home/image/placeholder?text=Product`;

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' },
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

(async () => {
  try {
    console.log('Logging in...');
    const login = await postJSON(`${API}/main/user/login`, { username: USERNAME, password: PASSWORD });
    if (login.code !== 0) { console.error('Login failed:', login.msg || login); process.exit(1); }
    const token = login.data.token;
    console.log('Login OK');

    console.log('\nFetching all products (all pages)...');
    const LABELS = ['Product', 'Item', 'Merchandise', 'Goods', 'Article', 'Commodity', 'Stock', 'Supply', 'Inventory', 'Piece'];
    const localPathRegex = /^\/uploads\/[0-9a-f-]+\.(png|jpg|jpeg|webp)$/;
    let fixed = 0;
    let skipped = 0;
    let notFound = 0;
    let labelIdx = 0;
    let page = 1;
    const pageSize = 100;
    let total = 0;

    do {
      const searchRes = await getJSON(`${API}/main/goods/getSearchList?page=${page}&pageSize=${pageSize}`, token);
      if (searchRes.code !== 0) { console.error('Failed at page', page, searchRes); break; }
      const list = searchRes.data?.list || [];
      total = searchRes.data?.total || list.length;
      if (list.length === 0) break;

      for (const product of list) {
        const img = product.images?.[0];
        if (!img) { notFound++; continue; }
        if (!localPathRegex.test(img)) { skipped++; continue; }

        const placeholderUrl = `${API}/home/image/placeholder?text=${encodeURIComponent(LABELS[labelIdx % LABELS.length])}`;
        labelIdx++;

        console.log(`\n[${fixed + 1}] ${product.name?.substring(0, 50)}`);
        console.log(`  Old: ${img}`);
        console.log(`  New: ${placeholderUrl}`);

        const update = await postJSON(`${API}/home/admin/update-product`, {
          id: product._id,
          images: [placeholderUrl],
        }, token);

        if (update.code === 0) {
          console.log('  Updated OK');
          fixed++;
        } else {
          console.log(`  FAILED: ${update.msg || JSON.stringify(update)}`);
        }
      }

      console.log(`  Page ${page} done (${list.length} items). Total fixed so far: ${fixed}`);
      page++;
    } while ((page - 1) * pageSize < total);

    console.log(`\n=== Done: Fixed ${fixed}, Skipped (Cloudinary/already OK) ${skipped}, No image field ${notFound}, Total products ${total} ===`);
  } catch (e) {
    console.error('Script failed:', e.message);
    process.exit(1);
  }
})();
