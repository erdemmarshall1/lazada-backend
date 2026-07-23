const https = require('https');

const BACKEND = 'https://lazada-backend-production-3b57.up.railway.app';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzhlNTg2ODQ3MzExYWJlMjEyNGU0YyIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3ODM4NzgxNTYsImV4cCI6MTc4NDQ4Mjk1Nn0.SdIs5-X7JL1iHBWmKF-qwNtAXtnkFWkBF1vXto0_QAQ';

const bannerUpdates = [
  { id: '6a38e5ab847311abe21252cd', image: '/uploads/banners/pc-banner1.png', title: 'Summer Sale - Up to 70% Off', link: '/miaoshalist', sort: 1 },
  { id: '6a38e5ab847311abe21252ce', image: '/uploads/banners/pc-banner2.png', title: 'New Arrivals Fashion 2026', link: '/tuijianlist', sort: 2 },
  { id: '6a38e5ab847311abe21252cf', image: '/uploads/banners/pc-banner3.png', title: 'Electronics Mega Deals', link: '/remenglist', sort: 3 },
  { id: '6a38e5ab847311abe21252d0', image: '/uploads/banners/pc-banner4.png', title: 'Beauty & Skincare Special', link: '/searchgoods?keyword=beauty', sort: 4 },
  { id: '6a38e5ab847311abe21252d1', image: '/uploads/banners/pc-banner1.png', title: 'Sports & Outdoors Collection', link: '/searchgoods?keyword=sports', sort: 5 },
];

function updateBanner(id, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const url = new URL(BACKEND + '/home/admin/banners/update/' + id);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': 'Bearer ' + TOKEN,
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error('Parse error: ' + body)); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  for (const banner of bannerUpdates) {
    console.log(`Updating banner ${banner.id} -> ${banner.image}...`);
    const result = await updateBanner(banner.id, {
      title: banner.title,
      image: banner.image,
      link: banner.link,
      sort: banner.sort,
    });
    console.log(`  Result: ${result.msg || JSON.stringify(result)}`);
  }

  console.log('\nVerifying...');
  const req = https.request(BACKEND + '/main/banner/getList', { method: 'GET' }, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
      const data = JSON.parse(body);
      if (data.code === 0) {
        data.data.forEach((b, i) => {
          console.log(`  Banner ${i + 1}: ${b.title} -> ${b.image}`);
        });
      }
    });
  });
  req.end();
}

main().catch(console.error);
