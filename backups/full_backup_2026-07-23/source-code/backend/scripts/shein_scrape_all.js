/**
 * shein_scrape_all.js
 *
 * Final comprehensive Shein scraper. Uses Puppeteer to:
 * 1. Scroll the homepage to get all visible products (including section products)
 * 2. Search each category keyword on Shein's search page
 * 3. Extract all products with name, price, image
 * 4. Save to JSON
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const SEARCH_TERMS = [
  { query: 'dresses', db: 'Women Clothing' },
  { query: 'women+top', db: 'Women Clothing' },
  { query: 'women+jacket', db: 'Women Clothing' },
  { query: 'women+shoes', db: 'Shoes' },
  { query: 'men+shoes', db: 'Shoes' },
  { query: 'men+shirt', db: 'Men Clothing' },
  { query: 'men+jacket', db: 'Men Clothing' },
  { query: 'handbag', db: 'Bags' },
  { query: 'backpack', db: 'Bags' },
  { query: 'watch', db: 'Accessories' },
  { query: 'sunglasses', db: 'Accessories' },
  { query: 'necklace', db: 'Accessories' },
  { query: 'headphones', db: 'Headphones' },
  { query: 'bluetooth+speaker', db: 'Bluetooth Speakers' },
  { query: 'smartwatch', db: 'Apple Watch' },
  { query: 'phone+case', db: 'Smartphones' },
  { query: 'laptop+bag', db: 'Bags' },
  { query: 'skincare', db: 'Skincare' },
  { query: 'makeup', db: 'Makeup' },
  { query: 'yoga+mat', db: 'Fitness' },
  { query: 'dumbbell', db: 'Fitness' },
  { query: 'furniture', db: 'Furniture' },
  { query: 'cushion', db: 'Furniture' },
  { query: 'toy', db: 'Accessories' },
  { query: 'pet+supplies', db: 'Accessories' },
];

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrapeSearchPage(browser, searchQuery, dbCategory) {
  const url = `https://us.shein.com/search?q=${searchQuery}`;
  console.log(`  Searching "${searchQuery}" -> ${dbCategory}...`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0');

  const products = [];

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(4000);

    // Scroll to load products
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await sleep(800);
    }

    // Extract using the same working method as homepage
    const extracted = await page.evaluate(() => {
      const items = [];
      const seenNames = new Set();

      // Method 1: product-card divs with role="link"
      const cards = document.querySelectorAll('div.product-card[role="link"]');
      for (const card of cards) {
        const ariaLabel = card.getAttribute('aria-label') || '';
        let name = ariaLabel;
        const priceMatch = name.match(/\s+\$[\d.,]+\s*$/);
        if (priceMatch) name = name.slice(0, priceMatch.index).trim();
        if (!name || name.length < 3) continue;

        let price = '';
        const priceEl = card.querySelector('.bff-price-container');
        if (priceEl) price = priceEl.getAttribute('aria-label') || '';
        if (!price) {
          const intEl = card.querySelector('.product-item__price-integer');
          const decEl = card.querySelector('.product-item__price-decimal');
          if (intEl) price = '$' + intEl.textContent.trim() + '.' + (decEl?.textContent?.trim() || '00');
        }

        const container = card.querySelector('.crop-image-container');
        let img = container ? (container.getAttribute('data-before-crop-src') || '') : '';
        if (!img) {
          const imgEl = card.querySelector('img');
          if (imgEl) img = imgEl.getAttribute('src') || '';
        }

        const key = name.slice(0, 30);
        if (!seenNames.has(key) && name && price) {
          seenNames.add(key);
          const priceNum = parseFloat(price.replace('$', ''));
          items.push({ name, price, priceNum, imageUrl: img });
        }
      }

      return items;
    });

    products.push(...extracted);
    console.log(`    Found ${extracted.length} products`);

  } catch (err) {
    console.log(`    Error: ${err.message}`);
  } finally {
    await page.close();
  }

  return { dbCategory, products };
}

async function scrapeHomepageProducts(browser) {
  console.log('\nScraping homepage products...');
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150.0.0.0');

  const products = [];

  try {
    await page.goto('https://us.shein.com/', { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(5000);

    // Aggressive scrolling
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(500);
    }
    await sleep(2000);

    const extracted = await page.evaluate(() => {
      const items = [];
      const seenNames = new Set();
      const cards = document.querySelectorAll('div.product-card[role="link"], div.product-card.home-product[role="link"]');
      for (const card of cards) {
        const ariaLabel = card.getAttribute('aria-label') || '';
        let name = ariaLabel;
        const priceMatch = name.match(/\s+\$[\d.,]+\s*$/);
        if (priceMatch) name = name.slice(0, priceMatch.index).trim();
        if (!name || name.length < 3) continue;

        let price = '';
        const priceEl = card.querySelector('.bff-price-container');
        if (priceEl) price = priceEl.getAttribute('aria-label') || '';

        const container = card.querySelector('.crop-image-container');
        let img = container ? (container.getAttribute('data-before-crop-src') || '') : '';
        if (!img) {
          const imgEl = card.querySelector('img');
          if (imgEl) img = imgEl.getAttribute('src') || '';
        }

        const key = name.slice(0, 30);
        if (!seenNames.has(key) && name && price) {
          seenNames.add(key);
          const priceNum = parseFloat(price.replace('$', ''));
          items.push({ name, price, priceNum, imageUrl: img });
        }
      }
      return items;
    });

    products.push(...extracted);
    console.log(`  Found ${extracted.length} products from homepage`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  } finally {
    await page.close();
  }

  return products;
}

async function main() {
  console.log('=== Shein Full Product Scraper ===\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // 1. Homepage products
  const homepageProducts = await scrapeHomepageProducts(browser);

  // 2. Search each category
  const allResults = [];
  for (const st of SEARCH_TERMS) {
    const result = await scrapeSearchPage(browser, st.query, st.db);
    for (const p of result.products) {
      allResults.push({ ...p, dbCategory: st.db, source: 'search' });
    }
    await sleep(1000);
  }

  // Add homepage products
  for (const p of homepageProducts) {
    allResults.push({ ...p, dbCategory: null, source: 'homepage' });
  }

  await browser.close();

  // Deduplicate by name
  const seen = new Set();
  const unique = [];
  for (const p of allResults) {
    const key = p.name.slice(0, 40).toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  console.log(`\n\n===== TOTAL: ${unique.length} unique products =====`);

  // Sort by price descending
  unique.sort((a, b) => b.priceNum - a.priceNum);

  // Show expensive products
  const over50 = unique.filter(p => p.priceNum >= 50);
  console.log(`\nProducts >= $50: ${over50.length}`);
  over50.slice(0, 30).forEach(p => console.log(`  $${p.priceNum} - ${p.name.slice(0, 60)} [${p.dbCategory || '?'}]`));

  // Group by category
  const byCat = {};
  for (const p of unique) {
    const cat = p.dbCategory || 'Uncategorized';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(p);
  }
  console.log('\nBy category:');
  for (const [cat, prods] of Object.entries(byCat)) {
    const over = prods.filter(p => p.priceNum >= 50).length;
    console.log(`  ${cat}: ${prods.length} total, ${over} >= $50`);
  }

  // Save
  const outputPath = path.join(__dirname, 'shein_all_products.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    total: unique.length,
    over50: over50.length,
    byCategory: Object.fromEntries(Object.entries(byCat).map(([k, v]) => [k, { count: v.length, over50: v.filter(p => p.priceNum >= 50).length, products: v }])),
    productsOver50: over50,
    all: unique,
  }, null, 2));
  console.log(`\nSaved to ${outputPath}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
