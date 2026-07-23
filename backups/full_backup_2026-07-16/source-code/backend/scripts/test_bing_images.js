const puppeteer = require('puppeteer-core');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  const query = 'Carhartt Detroit Jacket';
  console.log(`Searching Bing Images for: "${query}"`);
  
  await page.goto(
    `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC2`,
    { waitUntil: 'networkidle2', timeout: 20000 }
  );
  
  await new Promise(r => setTimeout(r, 3000));
  
  const info = await page.evaluate(() => {
    const all = [];
    document.querySelectorAll('img').forEach((img, i) => {
      if (i < 30) {
        all.push({
          idx: i,
          src: (img.src || '').substring(0, 120),
          dataSrc: (img.getAttribute('data-src') || '').substring(0, 120),
          mSrc: (img.getAttribute('m') || '') ? 'HAS_M_ATTR' : '',
          alt: (img.alt || '').substring(0, 50),
          className: (img.className || '').substring(0, 40),
        });
      }
    });
    return all;
  });

  console.log(`Found ${info.length} img elements`);
  info.forEach(img => {
    if (img.src && !img.src.includes('bing.com') && !img.src.endsWith('.svg')) {
      console.log(`  src="${img.src.substring(0, 100)}" alt="${img.alt}"`);
    }
  });

  await browser.close();
}

main().catch(err => console.error('FATAL:', err));
