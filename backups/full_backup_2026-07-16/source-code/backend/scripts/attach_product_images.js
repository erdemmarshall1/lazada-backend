const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const UPSTREAM = 'https://d3oobv9weovhej.cloudfront.net';

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const fetchJson = (url) => new Promise((resolve, reject) => {
  const proto = url.startsWith('https') ? https : http;
  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    timeout: 30000,
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://d3oobv9weovhej.cloudfront.net/',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
  const req = proto.request(options, (res) => {
    let data = '';
    res.on('data', c => data += c);
    res.on('end', () => {
      if (res.statusCode !== 200) { resolve(null); return; }
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
  });
  req.on('error', reject);
  req.end();
});

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

const scoreMatch = (pName, sName) => {
  const pTokens = normalizeName(pName).split(' ');
  const sTokens = normalizeName(sName).split(' ');
  let matches = 0;
  for (const pt of pTokens) {
    if (pt.length < 3) continue;
    for (const st of sTokens) {
      if (st.length < 3) continue;
      if (pt === st || st.includes(pt) || pt.includes(st)) { matches++; break; }
    }
  }
  return matches / Math.max(pTokens.length, 1);
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Fetch hot products
  const hot = await fetchJson(`${UPSTREAM}/main/goods/getHotList`);
  const allScraped = [...(hot?.list || [])];

  // Fetch recommended
  const rec = await fetchJson(`${UPSTREAM}/main/goods/getRecommendedList`);
  for (const item of rec?.list || []) {
    if (!allScraped.some(s => s.id === item.id)) allScraped.push(item);
  }

  // Fetch search results
  for (let i = 0; i < 5; i++) {
    const search = await fetchJson(`${UPSTREAM}/main/goods/search?page=${i}&pageSize=40`);
    for (const item of search?.list || []) {
      if (!allScraped.some(s => s.id === item.id)) allScraped.push(item);
    }
  }

  console.log(`Scraped ${allScraped.length} products from upstream`);

  const products = await Product.find({});
  let updated = 0;

  for (const product of products) {
    let bestScore = 0;
    let bestMatch = null;

    for (const scraped of allScraped) {
      if (!scraped.img) continue;
      const score = scoreMatch(product.name, scraped.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = scraped;
      }
    }

    if (bestMatch && bestScore >= 0.2) {
      const imgUrl = bestMatch.img.startsWith('http') ? bestMatch.img : `${UPSTREAM}${bestMatch.img}`;

      if (!product.images || product.images.length === 0 || !product.images[0].startsWith('http') || product.images[0].includes('placeholder')) {
        product.images = [imgUrl];
        await product.save();
        updated++;
        console.log(`  Updated: ${product.name.substring(0, 40)}... -> ${imgUrl.substring(0, 60)}...`);
      }
    }
  }

  console.log(`\nUpdated ${updated} / ${products.length} products with CDN image URLs`);
  await mongoose.disconnect();
};

run().catch(err => { console.error(err); process.exit(1); });
