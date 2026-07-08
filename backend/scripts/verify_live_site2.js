const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SITE = 'https://master.theoutnet-wholesales.pages.dev';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function checkImages(page, label) {
  // Scroll VERY slowly for lazy load
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(800);
  }
  // Go back to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);
  // Scroll again
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(800);
  }
  await sleep(3000);

  const results = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let visible = 0, loaded = 0, loading = 0, broken = 0, noimg = 0;
    imgs.forEach(img => {
      const src = img.src || '';
      const rect = img.getBoundingClientRect();
      if (rect.width < 30 || rect.height < 30) return;
      visible++;
      if (img.complete && img.naturalWidth > 0) loaded++;
      else if (img.complete && img.naturalWidth === 0) { broken++; console.log('Broken:', src); }
      else loading++;
      if (src.includes('No+Image') || src.includes('No%20Image')) noimg++;
    });
    return { visible, loaded, loading, broken, noimg };
  });

  console.log(`[${label}] Visible:${results.visible} Loaded:${results.loaded} Loading:${results.loading} Broken:${results.broken} NoImage:${results.noimg}`);
}

async function main() {
  const browser = await puppeteer.launch({ headless: false, executablePath: CHROME_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Check a few search page images directly first
  console.log('=== Checking images directly via HTTP HEAD ===');
  const https = require('https');
  const head = (url) => new Promise(res => https.get(url, { method: 'HEAD', timeout: 10000 }, r => { res(r.statusCode); }).on('error', () => res(0)).on('timeout', function() { this.destroy(); res(0); }));
  
  const testUrls = [
    'https://supportive-delight-production-b90c.up.railway.app/uploads/product_images/6a4b5d13507b0208132',
    'https://supportive-delight-production-b90c.up.railway.app/uploads/product_images/6a4b5d12507b0208132',
    'https://supportive-delight-production-b90c.up.railway.app/uploads/product_images/6a4b5d11507b0208132',
    'https://supportive-delight-production-b90c.up.railway.app/uploads/b0ac5e30-6eb0-43a3-ba3d-ff8d497375',
    'https://supportive-delight-production-b90c.up.railway.app/uploads/a190c76b-7092-4dc6-831f-331e15a371',
  ];
  for (const u of testUrls) {
    const code = await head(u);
    console.log(`  ${code} ${u.substring(0, 90)}`);
  }

  // Now browse live
  console.log('\n=== Homepage ===');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Homepage');

  console.log('\n=== Search Page 1 ===');
  await page.goto(SITE + '/#/searchgoods', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Search P1');

  console.log('\n=== Search Page 7 (was broken) ===');
  await page.goto(SITE + '/#/searchgoods?page=7', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Search P7');

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
