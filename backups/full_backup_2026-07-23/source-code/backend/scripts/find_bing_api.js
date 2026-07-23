const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QUERY = encodeURIComponent('Tory Burch Britten Pebble Chain Shoulder Bag Ivory');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-blink-features=AutomationControlled'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  const page = await browser.newPage();
  
  // Collect all XHR/fetch requests and responses
  const apiCalls = [];
  
  page.on('response', async (response) => {
    const url = response.url();
    const type = response.request().resourceType();
    if (type === 'xhr' || type === 'fetch' || url.includes('api') || url.includes('images')) {
      try {
        const status = response.status();
        const headers = response.headers();
        const contentType = headers['content-type'] || '';
        let size = 0;
        try {
          const buf = await response.buffer();
          size = buf.length;
        } catch(e) {}
        
        if (size > 1000) {
          apiCalls.push({ url: url.substring(0, 200), status, type, contentType: contentType.substring(0, 50), size });
          
          // If it looks like image data (JSON with image URLs), log the first 500 chars
          if (contentType.includes('json') && size < 500000) {
            try {
              const buf = await response.buffer();
              const text = buf.toString().substring(0, 1000);
              if (text.includes('http') && (text.includes('.jpg') || text.includes('.jpeg') || text.includes('.png') || text.includes('image') || text.includes('src'))) {
                console.log(`\n=== IMAGE DATA FOUND ===`);
                console.log(`URL: ${url.substring(0, 200)}`);
                console.log(`Status: ${status}, Size: ${(size/1024).toFixed(1)}KB`);
                console.log(`Content: ${text.substring(0, 500)}`);
              }
            } catch(e) {}
          }
        }
      } catch(e) {}
    }
  });

  console.log('Loading Bing Images...');
  await page.goto(`https://www.bing.com/images/search?q=${QUERY}`, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // Wait a bit for lazy-loaded content
  await new Promise(r => setTimeout(r, 3000));

  console.log(`\nTotal API calls tracked: ${apiCalls.length}`);
  
  // Print all API calls
  for (const call of apiCalls) {
    console.log(`\n[${call.type}] ${call.status} ${(call.size/1024).toFixed(1)}KB | ${call.url}`);
  }

  // Try to extract images from the page
  const imgs = await page.evaluate(() => {
    const allImgs = document.querySelectorAll('img');
    const results = [];
    allImgs.forEach(img => {
      if (img.src && !img.src.includes('bing.com/sa') && !img.src.includes('svg')) {
        results.push({ src: img.src, alt: img.alt, w: img.naturalWidth, h: img.naturalHeight });
      }
    });
    return results;
  });
  
  console.log(`\nActual product images on page: ${imgs.length}`);
  imgs.forEach((img, i) => {
    console.log(`  ${i+1}. ${img.src.substring(0, 100)} (${img.w}x${img.h})`);
  });

  await browser.close();
}

main().catch(console.error);
