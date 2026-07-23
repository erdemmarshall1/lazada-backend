const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

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

const pixabaySearch = (query) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=3&category=`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0' },
    timeout: 15000,
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

(async () => {
  try {
    // Login
    console.log('Logging in...');
    const login = await postJSON(`${API}/main/user/login`, { username: USERNAME, password: PASSWORD });
    if (login.code !== 0) { console.error('Login failed:', login.msg || login); process.exit(1); }
    const token = login.data.token;
    console.log('Login OK, token:', token?.slice(0,20) + '...');

    // Fetch banners
    console.log('\nFetching banners...');
    const bannerRes = await getJSON(`${API}/main/banner/getList`, token);
    if (bannerRes.code !== 0) { console.error('Failed to get banners:', bannerRes); process.exit(1); }
    const banners = bannerRes.data;
    console.log(`Found ${banners.length} banners`);

    // Search Pixabay for each banner and update
    for (const banner of banners) {
      const query = banner.title.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      console.log(`\n[${banner.sort}] "${banner.title}" -> searching Pixabay for: "${query}"`);
      try {
        const pixa = await pixabaySearch(query);
        if (pixa.hits && pixa.hits.length > 0) {
          const imgUrl = pixa.hits[0].webformatURL;
          console.log(`  Found: ${imgUrl}`);
          const update = await postJSON(`${API}/home/admin/banners/update/${banner._id}`, {
            image: imgUrl,
            title: banner.title,
            link: banner.link,
            sort: banner.sort,
          }, token);
          if (update.code === 0) {
            console.log('  Updated successfully');
          } else {
            console.log('  Update failed:', update.msg || update);
          }
        } else {
          console.log('  No Pixabay results, trying broader search...');
          const fallbackPixa = await pixabaySearch('sale shopping fashion');
          if (fallbackPixa.hits && fallbackPixa.hits.length > 0) {
            const imgUrl = fallbackPixa.hits[0].webformatURL;
            console.log(`  Found fallback: ${imgUrl}`);
            const update = await postJSON(`${API}/home/admin/banners/update/${banner._id}`, {
              image: imgUrl,
              title: banner.title,
              link: banner.link,
              sort: banner.sort,
            }, token);
            if (update.code === 0) {
              console.log('  Updated successfully');
            } else {
              console.log('  Update failed:', update.msg || update);
            }
          } else {
            console.log('  No fallback results either, skipping');
          }
        }
      } catch (e) {
        console.log('  Error:', e.message);
      }
    }

    console.log('\nDone! Verify at https://lazada-backend-production-3b57.up.railway.app/main/banner/getList');
  } catch (e) {
    console.error('Script failed:', e.message);
    process.exit(1);
  }
})();
