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
  console.log(`Searching Google Images for: "${query}"`);
  
  await page.goto(
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}&hl=en`,
    { waitUntil: 'networkidle2', timeout: 20000 }
  );
  
  // Wait a bit for images to load
  await new Promise(r => setTimeout(r, 3000));
  
  // Click on the first image result to load actual image (Google Images masonry)
  // First, let's dump all img elements
  const info = await page.evaluate(() => {
    const all = [];
    document.querySelectorAll('img').forEach((img, i) => {
      if (i < 20) {
        all.push({
          idx: i,
          src: (img.src || '').substring(0, 100),
          dataSrc: (img.getAttribute('data-src') || '').substring(0, 100),
          alt: (img.alt || '').substring(0, 50),
          width: img.width,
          height: img.height,
          className: (img.className || '').substring(0, 40),
        });
      }
    });
    return all;
  });

  console.log('\nFirst 20 img elements:');
  info.forEach(img => {
    console.log(`  #${img.idx} src="${img.src}" data-src="${img.dataSrc}" alt="${img.alt}"`);
  });

  // Also check the page title
  const title = await page.title();
  console.log(`\nPage title: ${title}`);

  await browser.close();
}

main().catch(err => console.error('FATAL:', err));
