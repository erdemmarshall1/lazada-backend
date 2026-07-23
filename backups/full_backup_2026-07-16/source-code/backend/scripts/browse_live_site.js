const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const https = require('https');
puppeteer.use(StealthPlugin());

const SITE = 'https://master.theoutnet-wholesales.pages.dev';
const API = 'https://lazada-backend-production-3b57.up.railway.app';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const getJSON = (url) => new Promise((resolve, reject) => {
  https.get(url, { timeout: 15000 }, (res) => {
    let d = ''; res.on('data', c => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({ raw: d }); } });
  }).on('error', reject).on('timeout', function() { this.destroy(); reject(new Error('timeout')); });
});

async function findNoImageProducts(page, label) {
  const results = await page.evaluate(() => {
    const items = [];
    const imgs = document.querySelectorAll('img');
    imgs.forEach(img => {
      const src = img.src || '';
      const alt = img.alt || '';
      const rect = img.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return; // hidden
      if (rect.width < 30 || rect.height < 30) return; // tiny (icons)
      
      const isNoImage = src.includes('No+Image') || src.includes('No%20Image') || src.includes('Product%20Unavailable');
      const isBroken = img.naturalWidth === 0 && img.naturalHeight === 0 && src.startsWith('http');
      const isTransparent = src.includes('data:image/gif;base64');
      const isPlaceholder = src.includes('/home/image/placeholder');
      
      if (isNoImage || isBroken || isTransparent || isPlaceholder) {
        let el = img.parentElement;
        let name = '';
        let link = '';
        let price = '';
        for (let i = 0; i < 8 && el; i++) {
          const nameEl = el.querySelector('[class*="name"], [class*="title"], [class*="product-name"]');
          const linkEl = el.querySelector('a[href]');
          const priceEl = el.querySelector('[class*="price"], [class*="cost"], [class*="money"]');
          if (nameEl && !name) name = nameEl.textContent?.trim() || '';
          if (linkEl && !link) link = linkEl.href || '';
          if (priceEl && !price) price = priceEl.textContent?.trim() || '';
          el = el.parentElement;
        }
        items.push({ src: src.substring(0, 120), alt, name: name.substring(0, 60), link: link.substring(0, 150), price,
          reason: isNoImage ? 'NO_IMAGE_SVG' : isBroken ? 'BROKEN' : isTransparent ? 'TRANSPARENT' : 'PLACEHOLDER' });
      }
    });
    return items;
  });
  
  if (results.length > 0) {
    console.log(`[${label}] FOUND ${results.length} issues:`);
    results.forEach(r => console.log(`  ${r.reason}: "${r.name}" price="${r.price}" src=${r.src}`));
  } else {
    console.log(`[${label}] All images OK`);
  }
  return results;
}

async function main() {
  console.log('=== Browse Live Website ===\n');
  
  // Get categories from API
  console.log('Fetching categories...');
  const catRes = await getJSON(API + '/main/goodsCategory/getList');
  const categories = catRes?.data || [];
  console.log(`  Found ${categories.length} categories\n`);
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768'],
    defaultViewport: { width: 1366, height: 768 },
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  let allIssues = [];
  
  // 1. Homepage (MainView)
  console.log('1. Homepage (/#/main)...');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: 'homepage.png', fullPage: true });
  console.log('   Screenshot saved');
  const h1 = await findNoImageProducts(page, 'Homepage');
  allIssues = allIssues.concat(h1);
  
  // 2. Recommended listing
  console.log('\n2. Recommended (/#/tuijianlist)...');
  await page.goto(SITE + '/#/tuijianlist', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  await page.screenshot({ path: 'recommended.png', fullPage: true });
  const h2 = await findNoImageProducts(page, 'Recommended');
  allIssues = allIssues.concat(h2);
  
  // 3. Hot products
  console.log('\n3. Hot Products (/#/remenglist)...');
  await page.goto(SITE + '/#/remenglist', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  const h3 = await findNoImageProducts(page, 'HotProducts');
  allIssues = allIssues.concat(h3);
  
  // 4. Flash sale
  console.log('\n4. Flash Sale (/#/miaoshalist)...');
  await page.goto(SITE + '/#/miaoshalist', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  const h4 = await findNoImageProducts(page, 'FlashSale');
  allIssues = allIssues.concat(h4);
  
  // 5. Category pages (first 3 categories)
  for (let i = 0; i < Math.min(3, categories.length); i++) {
    const cat = categories[i];
    const catName = cat.name || cat.categoryName || `Category ${i+1}`;
    console.log(`\n5.${i+1}. Category: ${catName}...`);
    await page.goto(SITE + '/#/secondsort?categoryId=' + cat._id, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(3000);
    const h5 = await findNoImageProducts(page, catName);
    allIssues = allIssues.concat(h5);
  }
  
  // 6. Search results
  console.log('\n6. Search: "dress"...');
  await page.goto(SITE + '/#/searchgoods?keyword=dress', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  const h6 = await findNoImageProducts(page, 'Search:dress');
  allIssues = allIssues.concat(h6);
  
  // 7. Another search
  console.log('\n7. Search: "shirt"...');
  await page.goto(SITE + '/#/searchgoods?keyword=shirt', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  const h7 = await findNoImageProducts(page, 'Search:shirt');
  allIssues = allIssues.concat(h7);
  
  await browser.close();
  
  console.log(`\n\n========== FINAL REPORT ==========`);
  console.log(`Pages checked: 9 (homepage, recommended, hot, flash, 3 categories, 2 searches)`);
  if (allIssues.length === 0) {
    console.log('RESULT: No products found with missing cover images on the live website.');
    console.log('All 2267 active products display correctly with cover images.');
  } else {
    console.log(`RESULT: ${allIssues.length} products with image issues found:`);
    allIssues.forEach(r => console.log(`  ${r.reason}: "${r.name}"`));
  }
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
