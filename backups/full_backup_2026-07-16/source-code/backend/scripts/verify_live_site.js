const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SITE = 'https://master.theoutnet-wholesales.pages.dev';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function checkImages(page, label) {
  await sleep(3000); // wait for lazy-load
  // Scroll slowly to trigger lazy loading
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight / 3));
    await sleep(500);
  }
  await sleep(2000);

  const results = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img');
    let visible = 0, loaded = 0, broken = 0, noimage_placeholders = 0;
    const details = [];
    imgs.forEach(img => {
      const src = img.src || '';
      const alt = img.alt || '';
      const rect = img.getBoundingClientRect();
      if (rect.width < 30 || rect.height < 30) return;
      visible++;
      const isBroken = img.naturalWidth === 0 && img.naturalHeight === 0 && src.startsWith('http');
      const isNoImage = src.includes('No+Image') || src.includes('No%20Image');
      const complete = img.complete && img.naturalWidth > 0;
      if (complete) loaded++;
      if (isBroken) { broken++; details.push({ src: src.substring(0, 100), alt: alt.substring(0, 50) }); }
      if (isNoImage) noimage_placeholders++;
    });
    return { visible, loaded, broken, noimage_placeholders, details };
  });

  console.log(`[${label}] Visible: ${results.visible}, Loaded: ${results.loaded}, Broken: ${results.broken}, NoImage: ${results.noimage_placeholders}`);
  if (results.details.length > 0) {
    results.details.forEach(d => console.log('  Broken: ' + d.src + ' | ' + d.alt));
  }
  return results;
}

async function main() {
  const browser = await puppeteer.launch({ headless: false, executablePath: CHROME_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Homepage
  console.log('\n=== Homepage ===');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Homepage');

  // Search page 1
  console.log('\n=== Search Page 1 ===');
  await page.goto(SITE + '/#/searchgoods', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Search P1');

  // Search page 2
  console.log('\n=== Search Page 2 ===');
  await page.goto(SITE + '/#/searchgoods?page=2', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Search P2');

  // Category (secondsort)
  console.log('\n=== Category (SecondSort) ===');
  await page.goto(SITE + '/#/secondsort?id=6fb0147911a448e7b8752cc8236b4965', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Category');

  // Flash Sale
  console.log('\n=== Flash Sale ===');
  await page.goto(SITE + '/#/miaoshalist', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Flash Sale');

  // Recommended
  console.log('\n=== Recommended ===');
  await page.goto(SITE + '/#/tuijianlist', { waitUntil: 'networkidle0', timeout: 30000 });
  await checkImages(page, 'Recommended');

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
