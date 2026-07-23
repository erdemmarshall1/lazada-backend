const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QUERY = encodeURIComponent('Tory Burch Britten Pebble Chain Shoulder Bag Ivory');

async function testGoogle() {
  console.log('Testing Google Images with Puppeteer Stealth...\n');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',  // New headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
    ],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();
    
    // Override navigator.webdriver
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });

    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // 1. Try Google Images
    console.log('Fetching Google Images...');
    await page.goto(`https://www.google.com/search?tbm=isch&q=${QUERY}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    const body = await page.content();
    const hasResults = !body.includes('not found') && !body.includes('captcha');
    console.log(`Google: page loaded, length=${body.length}, has results: ${hasResults}`);
    console.log(`URL: ${page.url()}`);
    console.log(`Title: ${await page.title()}`);
    
    // Try to extract images
    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src^="http"]'))
        .slice(0, 5)
        .map(img => ({ src: img.src, alt: img.alt, w: img.width, h: img.height }));
    });
    
    console.log(`Google images found: ${imgs.length}`);
    imgs.forEach((img, i) => console.log(`  ${i+1}. ${img.src.substring(0, 80)} alt="${img.alt?.substring(0, 40)}" ${img.w}x${img.h}`));

    // 2. Try Bing Images
    console.log('\nFetching Bing Images...');
    await page.goto(`https://www.bing.com/images/search?q=${QUERY}`, {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    const body2 = await page.content();
    console.log(`Bing: page loaded, length=${body2.length}`);
    console.log(`Title: ${await page.title()}`);
    
    const imgs2 = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src^="http"]'))
        .slice(0, 5)
        .map(img => ({ src: img.src, alt: img.alt, w: img.width, h: img.height }));
    });
    
    console.log(`Bing images found: ${imgs2.length}`);
    imgs2.forEach((img, i) => console.log(`  ${i+1}. ${img.src.substring(0, 80)} alt="${img.alt?.substring(0, 40)}" ${img.w}x${img.h}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
}

testGoogle().catch(console.error);
