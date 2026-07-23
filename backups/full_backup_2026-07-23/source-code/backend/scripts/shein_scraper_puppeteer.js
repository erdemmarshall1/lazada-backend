const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function scrapeSheinHomepage() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36');

  const results = {
    products: [],
    banners: [],
    categories: [],
    sections: [],
    scrapedAt: new Date().toISOString()
  };

  try {
    console.log('Navigating to Shein homepage...');
    await page.goto('https://us.shein.com/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Page loaded. Waiting for content to render...');
    await new Promise(r => setTimeout(r, 5000));

    // Scroll to trigger lazy loading
    await autoScroll(page);

    console.log('Extracting products...');
    // Save rendered HTML for analysis
    const html = await page.content();
    fs.writeFileSync(path.join(__dirname, 'shein_rendered.html'), html);
    console.log(`Saved rendered HTML (${html.length} bytes)`);

    results.products = await extractProducts(page);

    console.log('Extracting banners...');
    results.banners = await extractBanners(page);

    console.log('Page diagnostics...');
    const diag = await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      const classNames = [];
      const labelsWithPrice = [];
      let linkWithDashP = 0;
      let linkWithProductWord = 0;

      for (const el of allEls) {
        const cls = el.className || '';
        if (typeof cls === 'string') {
          cls.split(/\s+/).forEach(c => {
            if (c && (c.toLowerCase().includes('product')
              || c.toLowerCase().includes('goods')
              || c.toLowerCase().includes('card')
              || c.toLowerCase().includes('price')
              || c.toLowerCase().includes('prod'))) {
              if (!classNames.includes(c)) classNames.push(c);
            }
          });
        }
        if (el.tagName === 'A' && el.href && el.href.includes('shein.com/')) {
          const href = el.href;
          if (href.includes('-p-')) linkWithDashP++;
          const label = el.getAttribute('aria-label') || '';
          if (label.includes('$')) {
            if (!labelsWithPrice.find(l => l.name === label)) {
              labelsWithPrice.push({ name: label.slice(0, 100), href: href.slice(0, 120) });
            }
          }
        }
      }
      return { classNames, labelsWithPrice, linkWithDashP };
    });

    console.log(`Product-related classes (${diag.classNames.length}):`, diag.classNames.join(', '));
    console.log(`Links with "-p-": ${diag.linkWithDashP}`);
    console.log(`Aria labels with $: ${diag.labelsWithPrice.length}`);
    diag.labelsWithPrice.slice(0, 15).forEach(l => console.log(`  $ Label: ${l.name}`));

    console.log('Extracting categories...');
    results.categories = await extractCategories(page);

    console.log('Extracting sections...');
    results.sections = await extractSections(page);

    console.log(`Found ${results.products.length} products, ${results.banners.length} banners, ${results.categories.length} categories, ${results.sections.length} sections`);

  } catch (err) {
    console.error('Scraping error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      const distance = 300;
      const delay = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        if (document.body.scrollHeight - window.scrollY - window.innerHeight < 100) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
}

async function extractProducts(page) {
  return await page.evaluate(() => {
    const products = [];

    // Shein renders product cards as divs with these classes
    const cardDivs = document.querySelectorAll('div.product-card.home-product[role="link"]');

    for (const card of cardDivs) {
      // 1. Name from aria-label (strip trailing price like " $12.34")
      const ariaLabel = card.getAttribute('aria-label') || '';
      let name = ariaLabel;
      const priceMatch = name.match(/\s+\$[\d.,]+\s*$/);
      if (priceMatch) {
        name = name.slice(0, priceMatch.index).trim();
      }

      // 2. Price from aria-label
      let price = '';
      const priceAria = card.querySelector('.bff-price-container');
      if (priceAria) {
        price = priceAria.getAttribute('aria-label') || '';
      }

      // 3. Image from crop-image-container's data-before-crop-src
      const cropContainer = card.querySelector('.crop-image-container');
      let imageUrl = cropContainer
        ? (cropContainer.getAttribute('data-before-crop-src') || '')
        : '';

      if (!imageUrl) {
        const img = card.querySelector('img');
        if (img) {
          imageUrl = img.getAttribute('src')
            || img.getAttribute('data-src')
            || img.getAttribute('data-webp-src')
            || '';
        }
      }

      // 4. Product link (the anchor tag inside the card)
      const anchor = card.querySelector('a');
      const link = anchor ? (anchor.getAttribute('href') || '') : '';

      if (name && price) {
        products.push({
          name: name.trim(),
          price: price.trim(),
          imageUrl: imageUrl.startsWith('//') ? 'https:' + imageUrl : imageUrl,
          link: link.startsWith('//') ? 'https:' + link : link
        });
      }
    }

    return products;
  });
}

async function extractBanners(page) {
  return await page.evaluate(() => {
    const banners = [];

    // Find carousel/slider elements
    const carouselSelectors = [
      '[class*="carousel"] img',
      '[class*="slide"] img',
      '[class*="swiper"] img',
      '[class*="banner"] img',
      '[class*="hero"] img',
      '[class*="main-banner"] img'
    ];

    for (const sel of carouselSelectors) {
      const imgs = document.querySelectorAll(sel);
      for (const img of imgs) {
        const src = img.getAttribute('src')
          || img.getAttribute('data-src')
          || img.getAttribute('data-before-crop-src')
          || '';
        const alt = img.getAttribute('alt') || '';
        const parentLink = img.closest('a');
        const link = parentLink?.getAttribute('href') || '';

        if (src && alt) {
          banners.push({ imageUrl: src, alt, link });
        }
      }
    }

    return banners;
  });
}

async function extractCategories(page) {
  return await page.evaluate(() => {
    const categories = [];

    // Find category links
    const categorySelectors = [
      'a[class*="category"]',
      'a[class*="nav-item"]',
      'a[class*="menu-item"]',
      'nav a',
      '[class*="header"] a[href*="category"]',
      'a[class*="cate"]',
      '[class*="category-grid"] a',
      '[class*="categories"] a'
    ];

    const seen = new Set();
    for (const sel of categorySelectors) {
      const links = document.querySelectorAll(sel);
      for (const link of links) {
        const name = link.textContent?.trim() || link.getAttribute('aria-label') || '';
        const href = link.getAttribute('href') || '';
        const img = link.querySelector('img');
        const imgUrl = img?.getAttribute('src') || img?.getAttribute('data-src') || '';
        const key = name + href;

        if (name && !seen.has(key)) {
          seen.add(key);
          categories.push({ name, link: href, imageUrl: imgUrl });
        }
      }
    }

    return categories;
  });
}

async function extractSections(page) {
  return await page.evaluate(() => {
    const sections = [];
    const sectionEls = document.querySelectorAll('section, [class*="section"], [class*="home-section"], [class*="module"]');

    for (const el of sectionEls) {
      const className = el.className || '';
      const id = el.id || '';
      const heading = el.querySelector('h1, h2, h3, h4, [class*="title"], [class*="heading"]');
      const title = heading?.textContent?.trim() || '';

      if (title || (className && className.length < 100)) {
        sections.push({
          title,
          className: className.slice(0, 200),
          id
        });
      }
    }

    return sections;
  });
}

async function main() {
  const data = await scrapeSheinHomepage();

  const outputPath = path.join(__dirname, 'shein_homepage_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nData saved to ${outputPath}`);

  // Summary
  console.log('\n=== SCRAPE SUMMARY ===');
  console.log(`Products: ${data.products.length}`);
  console.log(`Banners: ${data.banners.length}`);
  console.log(`Categories: ${data.categories.length}`);
  console.log(`Sections: ${data.sections.length}`);

  // Top products by price
  if (data.products.length > 0) {
    const withPrice = data.products.filter(p => {
      const m = p.price.match(/[\d.]+/);
      return m && parseFloat(m[0]) >= 50;
    });
    console.log(`\nProducts >= $50: ${withPrice.length}`);
    withPrice.sort((a, b) => {
      const pa = parseFloat((a.price.match(/[\d.]+/) || ['0'])[0]);
      const pb = parseFloat((b.price.match(/[\d.]+/) || ['0'])[0]);
      return pb - pa;
    });
    withPrice.slice(0, 20).forEach(p => console.log(`  ${p.price} - ${p.name.slice(0, 80)}`));
  }
}

main().catch(console.error);
