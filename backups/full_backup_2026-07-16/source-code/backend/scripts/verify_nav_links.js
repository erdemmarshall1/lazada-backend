const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SITE = 'https://master.theoutnet-wholesales.pages.dev';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({ headless: false, executablePath: CHROME_PATH, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Homepage
  console.log('1. Homepage...');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  let url = page.url();
  console.log('   URL: ' + url);
  let content = await page.content();
  let hasOffline = content.includes('You\'re Offline') || content.includes('You are offline');
  console.log('   Offline page: ' + (hasOffline ? 'YES (BAD!)' : 'No (good)'));

  // Click "Just In" nav link
  console.log('\n2. Clicking "Just In" nav link...');
  const justIn = await page.$('nav.ton-nav a:nth-child(1)');
  if (justIn) {
    await justIn.click();
    await sleep(3000);
    url = page.url();
    console.log('   URL: ' + url);
    content = await page.content();
    hasOffline = content.includes('You\'re Offline') || content.includes('You are offline');
    console.log('   Offline page: ' + (hasOffline ? 'YES (BAD!)' : 'No (good)'));
    console.log('   Expected: /#/searchgoods, Got: ' + url.split('#')[1] || url);
  }

  // Click "Sign In" link
  console.log('\n3. Clicking "Sign In" link...');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);
  const signIn = await page.$('a.ton-header-signin');
  if (signIn) {
    await signIn.click();
    await sleep(3000);
    url = page.url();
    console.log('   URL: ' + url);
    content = await page.content();
    hasOffline = content.includes('You\'re Offline') || content.includes('You are offline');
    console.log('   Offline page: ' + (hasOffline ? 'YES (BAD!)' : 'No (good)'));
    console.log('   Expected: /#/login, Got: ' + (url.split('#')[1] || url));
  }

  // Try direct navigation to login
  console.log('\n4. Direct navigation to /login page...');
  await page.goto(SITE + '/login', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(3000);
  url = page.url();
  console.log('   URL: ' + url);
  content = await page.content();
  hasOffline = content.includes('You\'re Offline') || content.includes('You are offline');
  console.log('   Offline page: ' + (hasOffline ? 'YES (BAD!)' : 'No (good)'));

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
