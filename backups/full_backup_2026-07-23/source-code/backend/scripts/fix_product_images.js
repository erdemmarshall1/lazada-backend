const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const UPSTREAM_BASE = 'https://d3oobv9weovhej.cloudfront.net';
const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const CACHE_FILE = path.join(__dirname, '..', '..', 'cdn_urls.json');

const PAYMENT_METHODS = ['USDT', 'BTC', 'Debit/Credit Card', 'ACH Transfer', 'Wire Transfer', 'Bitcoin', 'Ethereum']
const DEFAULT_WALLET = 'lv2939dhH93j299jd20Ooo92jj3j8dj!88jd'

const get = (url, timeout = 30000) => new Promise((resolve, reject) => {
  const proto = url.startsWith('https') ? https : http;
  const parsedUrl = new URL(url);
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.pathname + parsedUrl.search,
    method: 'GET',
    timeout,
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': `${UPSTREAM_BASE}/`,
      'X-Requested-With': 'XMLHttpRequest',
    },
  };
  const req = proto.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      resolve(data);
    });
  });
  req.on('error', reject);
  req.on('timeout', function () { req.destroy(); reject(new Error('Timeout')); });
  req.end();
});

const fetchJSON = async (url) => JSON.parse(await get(url));

function tokenize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
}

function scoreMatch(dbName, cdnName) {
  const dbTokens = tokenize(dbName);
  const cdnTokens = tokenize(cdnName);
  if (dbTokens.length === 0 || cdnTokens.length === 0) return 0;
  const common = dbTokens.filter(t => cdnTokens.includes(t));
  const score = common.length / Math.max(dbTokens.length, cdnTokens.length);
  let bonus = 0;
  if (cdnName.toLowerCase().includes(dbName.toLowerCase()) || dbName.toLowerCase().includes(cdnName.toLowerCase())) bonus = 0.3;
  return score + bonus;
}

async function scrapeUpstream() {
  if (fs.existsSync(CACHE_FILE)) {
    console.log('Loading cached CDN URLs...');
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  }

  console.log('Scraping upstream for CDN URLs...');
  const seenNames = new Set();
  const cdnMap = [];

  try {
    const hot = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getHotList`);
    for (const item of hot.list || []) {
      const name = (item.name || '').trim();
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);
      cdnMap.push({ name, img: item.img || '' });
    }
    console.log(`  Hot: ${cdnMap.length} unique`);
  } catch (e) { console.error(`  Hot failed: ${e.message}`); }

  try {
    const rec = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getSearchList?isRecommended=true&pageSize=200`);
    for (const item of rec.list || []) {
      const name = (item.name || '').trim();
      if (!name || seenNames.has(name)) continue;
      seenNames.add(name);
      cdnMap.push({ name, img: item.img || '' });
    }
    console.log(`  Recommended: ${cdnMap.length} unique`);
  } catch (e) { console.error(`  Recommended failed: ${e.message}`); }

  if (cdnMap.length < 100) {
    try {
      const more = await fetchJSON(`${UPSTREAM_BASE}/main/goods/getSearchList?pageSize=200`);
      for (const item of more.list || []) {
        const name = (item.name || '').trim();
        if (!name || seenNames.has(name)) continue;
        seenNames.add(name);
        cdnMap.push({ name, img: item.img || '' });
      }
      console.log(`  Search: ${cdnMap.length} unique`);
    } catch (e) { console.error(`  Search failed: ${e.message}`); }
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cdnMap, null, 2));
  console.log(`\nTotal scraped: ${cdnMap.length} (cached to cdn_urls.json)`);
  return cdnMap;
}

async function updateProducts(cdnMap) {
  const Product = require('../models/Product');

  const allDbProducts = await Product.find({}).lean();
  console.log(`Products in DB: ${allDbProducts.length}`);

  let updated = 0;
  let notFound = 0;
  let matchScores = [];

  for (const dbProduct of allDbProducts) {
    const dbName = (dbProduct.name || '').trim();
    let bestScore = 0;
    let bestMatch = null;

    for (const cdn of cdnMap) {
      const score = scoreMatch(dbName, cdn.name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = cdn;
      }
    }

    if (bestMatch && bestScore >= 0.3 && bestMatch.img) {
      const cdnUrl = bestMatch.img.startsWith('http') ? bestMatch.img : `${UPSTREAM_BASE}${bestMatch.img}`;
      await Product.findByIdAndUpdate(dbProduct._id, { $set: { images: [cdnUrl] } });
      updated++;
      matchScores.push({ dbName: dbName.slice(0, 60), cdnName: bestMatch.name.slice(0, 60), score: bestScore.toFixed(2) });
    } else {
      notFound++;
    }
  }

  matchScores.sort((a, b) => b.score - a.score);
  console.log('\nTop 10 matches by score:');
  matchScores.slice(0, 10).forEach(m => console.log(`  ${m.score} | ${m.dbName}...`));
  if (matchScores.length > 0) {
    console.log('  ...');
    matchScores.slice(-3).forEach(m => console.log(`  ${m.score} | ${m.dbName}...`));
  }

  console.log(`\nUpdated: ${updated}, Not matched: ${notFound}`);
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const cdnMap = await scrapeUpstream();
    if (cdnMap.length === 0) { console.error('No products scraped.'); process.exit(1); }

    await updateProducts(cdnMap);
    process.exit(0);
  } catch (error) {
    console.error('Failed:', error);
    process.exit(1);
  }
}

main();
