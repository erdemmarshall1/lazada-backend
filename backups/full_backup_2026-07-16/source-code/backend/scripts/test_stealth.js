const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const query = 'Carhartt Detroit Jacket';
  console.log(`Searching Google Images for: "${query}"`);

  await page.goto(
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&hl=en`,
    { waitUntil: 'networkidle2', timeout: 30000 }
  );
  
  await new Promise(r => setTimeout(r, 4000));

  const images = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('data-src') || '';
      if (src.startsWith('http') && !src.includes('google') && !src.includes('gstatic') && src.length > 50) {
        results.push({ src: src.substring(0, 120), alt: (img.alt || '').substring(0, 50) });
      }
    });
    return results;
  });

  console.log(`Found ${images.length} images:`);
  images.forEach((img, i) => console.log(`  ${i+1}. ${img.src} [${img.alt}]`));

  // Also check a search result page (web search, not image)
  console.log('\n--- Also try regular Google search ---');
  await page.goto(
    `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en`,
    { waitUntil: 'networkidle2', timeout: 30000 }
  );
  await new Promise(r => setTimeout(r, 2000));

  const pageTitle = await page.title();
  console.log(`Title: ${pageTitle}`);

  await browser.close();
}

main().catch(err => console.error('FATAL:', err));
