const puppeteer = require('puppeteer-core');
const https = require('https');
const http = require('http');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const API = 'https://lazada-backend-production-3b57.up.railway.app';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getJSON = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(null); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

async function main() {
  // Get the first 5 products with Pixabay images
  const data = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=23`);
  const products = data?.data?.list || [];
  const pixabayProducts = products.filter(p => (p.images?.[0] || '').includes('pixabay.com'));
  console.log(`Found ${pixabayProducts.length} Pixabay products on this page\n`);

  if (pixabayProducts.length === 0) {
    console.log('No Pixabay products found on this page');
    return;
  }

  const testBatch = pixabayProducts.slice(0, 3);

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  for (const product of testBatch) {
    const name = product.name.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 80);
    console.log(`\nSearching: "${name}"`);

    try {
      await page.goto(
        `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(name)}&hl=en`,
        { waitUntil: 'networkidle2', timeout: 20000 }
      );
      await sleep(2000);

      const urls = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('img').forEach(img => {
          const src = img.src || img.getAttribute('data-src') || '';
          if (src.startsWith('http') && !src.includes('google') && !src.includes('gstatic') && !src.endsWith('.svg')) {
            results.push(src.substring(0, 120));
          }
        });
        return results.slice(0, 5);
      });

      console.log(`  Found ${urls.length} candidate images:`);
      urls.forEach((u, i) => console.log(`    ${i+1}. ${u}`));
    } catch (err) {
      console.log(`  Error: ${err.message.substring(0, 80)}`);
    }
  }

  await browser.close();
  console.log('\nDone');
}

main().catch(err => console.error('FATAL:', err));
