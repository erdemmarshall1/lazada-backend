const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const SITE = 'https://811db5f7.theoutnet-wholesales.pages.dev';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({ headless: false, executablePath: CHROME_PATH, args: ['--no-sandbox', '--disable-background-networking'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Clear cache
  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');

  async function checkOffline(label, targetUrl) {
    console.log(`\n${label}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(2000);
    const url = page.url();
    const content = await page.content();
    const hasOffline = content.includes("You're Offline") || content.includes('You are offline');
    const title = await page.title();
    console.log(`   URL: ${url}`);
    console.log(`   Title: ${title}`);
    console.log(`   Offline: ${hasOffline ? 'YES (BAD!)' : 'No (good)'}`);
    return { url, hasOffline };
  }

  await checkOffline('1. Homepage', SITE + '/#/main');

  // Click nav links
  console.log('\n2. Clicking desktop nav links...');
  await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(2000);

  const navLinks = await page.$$('nav.ton-nav a');
  console.log(`   Found ${navLinks.length} nav links`);
  
  for (let i = 0; i < navLinks.length; i++) {
    const text = await page.evaluate(el => el.textContent.trim(), navLinks[i]);
    console.log(`   Clicking "${text}"...`);
    await navLinks[i].click();
    await sleep(2000);
    const url = page.url();
    const content = await page.content();
    const hasOffline = content.includes("You're Offline") || content.includes('You are offline');
    console.log(`     URL: ${url}, Offline: ${hasOffline ? 'YES' : 'No'}`);
    // Go back
    await page.goto(SITE + '/#/main', { waitUntil: 'networkidle0', timeout: 30000 });
    await sleep(1500);
  }

  // Click Sign In
  console.log('\n3. Clicking Sign In...');
  const signIn = await page.$('a.ton-header-signin');
  if (signIn) {
    const text = await page.evaluate(el => el.outerHTML, signIn);
    console.log(`   Element HTML: ${text.substring(0, 120)}`);
    await signIn.click();
    await sleep(3000);
    const url = page.url();
    const content = await page.content();
    const hasOffline = content.includes("You're Offline") || content.includes('You are offline');
    console.log(`   URL: ${url}, Offline: ${hasOffline ? 'YES' : 'No'}`);
  }

  // Direct /login
  await checkOffline('4. Direct /login', SITE + '/login');
  
  // Direct /#/login
  await checkOffline('5. Direct /#/login', SITE + '/#/login');

  await browser.close();
  console.log('\n=== Done ===');
}

main().catch(err => { console.error(err); process.exit(1); });
