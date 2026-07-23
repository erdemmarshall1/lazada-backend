const https = require('https');
const http = require('http');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PER_PAGE = 100;
const RESULT_FILE = 's3_image_results.json';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(new Error('parse')); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

const checkUrl = (url, timeout = 10000) => new Promise((resolve) => {
  if (!url || typeof url !== 'string') return resolve(false);
  const mod = url.startsWith('https') ? https : http;
  const req = mod.get(url, { method: 'HEAD', timeout }, (res) => {
    resolve(res.statusCode >= 200 && res.statusCode < 400);
  });
  req.on('error', () => resolve(false));
  req.on('timeout', () => { req.destroy(); resolve(false); });
});

async function main() {
  console.log('Checking if original s3.popularity1.shop images still work...\n');
  
  let allProducts = [];
  let page = 1;
  let total = Infinity;
  while (allProducts.length < total) {
    const data = await getJSON(`${API}/main/goods/getSearchList?page=${page}&pageSize=${PER_PAGE}`);
    const list = data?.data?.list || [];
    total = data?.data?.total || list.length;
    allProducts = allProducts.concat(list);
    if (list.length < PER_PAGE) break;
    page++;
    await sleep(200);
  }
  console.log(`Total products: ${allProducts.length}`);

  // Find products with Pixabay images
  const pixabayProducts = allProducts.filter(p => (p.images?.[0] || '').includes('pixabay.com'));
  console.log(`Products with Pixabay (stock) images: ${pixabayProducts.length}\n`);

  // Get the first 100 Pixabay products
  const sample = pixabayProducts.slice(0, 100);

  // Search for original product URLs on Google
  let working = 0;
  let notFound = 0;
  let checkCount = 0;

  console.log('Testing possible original image URL patterns...\n');

  // Try some common patterns for the s3 popularity1 shop
  const patterns = [
    'https://s3.popularity1.shop/productimages/',
    'https://s3.popularity1.shop/images/',
    'https://s3.popularity1.shop/products/',
    'https://cdn.popularity1.shop/',
  ];

  for (const pattern of patterns) {
    const testUrl = pattern + 'test.jpg';
    const exists = await checkUrl(testUrl);
    console.log(`${pattern}: ${exists ? 'WORKS' : 'DEAD'}`);
  }

  // Try Google search using the simple HTML endpoint  
  console.log('\nTrying Google search API via libre...');
  const { execSync } = require('child_process');
  
  // Just do a simple lookup for 3 product names
  const testNames = pixabayProducts.slice(0, 3).map(p => p.name);
  
  for (const name of testNames) {
    const query = encodeURIComponent(name.substring(0, 50));
    console.log(`\n  "${name.substring(0, 40)}..."`);
    
    // Try DuckDuckGo's lite HTML search
    try {
      const html = await new Promise((resolve, reject) => {
        const u = `https://lite.duckduckgo.com/lite/?q=${query}`;
        https.get(u, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve(d));
        }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
      });
      
      // Extract image URLs from DDG lite results
      const imgMatches = html.match(/<img[^>]+src="([^"]+)"[^>]*>/g) || [];
      const imgUrls = imgMatches
        .map(m => m.match(/src="([^"]+)"/)?.[1])
        .filter(s => s && s.startsWith('http'))
        .slice(0, 3);
      
      console.log(`  DDG Lite images: ${imgUrls.length}`);
      imgUrls.forEach(u => console.log(`    ${u.substring(0, 80)}`));
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }
  }
}

main().catch(err => console.error('FATAL:', err));
