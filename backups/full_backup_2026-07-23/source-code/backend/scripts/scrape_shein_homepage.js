/**
 * scrape_shein_homepage.js
 *
 * Fetches Shein US homepage, parses product cards, extracts high-priced
 * products (>= $50), categories, banners, and layout info.
 *
 * Output: shein_snapshot.json
 *
 * Usage: node scripts/scrape_shein_homepage.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SHEIN_URL = 'https://us.shein.com/?cdn_rsite=cf&ref=www&rep=dir&ret=us';
const MIN_PRICE = 50;
const OUTPUT_FILE = path.join(__dirname, 'shein_snapshot.json');

const fetchUrl = (url) => new Promise((resolve, reject) => {
  const mod = url.startsWith('https') ? https : http;
  mod.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 30000,
  }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => resolve(data));
  }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
});

const parseProducts = (html) => {
  const products = [];
  // Match product-card blocks
  const cardRegex = /<div\s+class="product-card[^"]*"[^>]*>[\s\S]{0,2000}(?=<\/div>\s*<\/div>\s*<\/div>)/g;
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[0];
    // Extract name + price from aria-label
    const ariaMatch = block.match(/aria-label="([^"]+)"/);
    if (!ariaMatch) continue;
    const ariaText = ariaMatch[1];

    // Parse price from aria-label (text before last $)
    const dollarIdx = ariaText.lastIndexOf('$');
    if (dollarIdx === -1) continue;
    const name = ariaText.slice(0, dollarIdx).replace(/&#39;/g, "'").replace(/&amp;/g, '&').trim();
    const priceStr = ariaText.slice(dollarIdx + 1).replace(/,/g, '').trim();
    const price = parseFloat(priceStr);
    if (isNaN(price)) continue;

    // Extract product ID
    const idMatch = block.match(/data-expose-id="([^"]+)"/);
    const productId = idMatch ? idMatch[1] : '';

    // Extract image URL
    let image = '';
    const srcMatch = block.match(/data-before-crop-src="([^"]+)"/);
    if (srcMatch) {
      image = srcMatch[1];
      if (image.startsWith('//')) image = 'https:' + image;
    } else {
      const imgSrcMatch = block.match(/<img[^>]+src="([^"]+)"/);
      if (imgSrcMatch) {
        image = imgSrcMatch[1];
        if (image.startsWith('//')) image = 'https:' + image;
      }
    }

    // Check if there's an original price (strikethrough price)
    let originalPrice = 0;
    const origPriceMatch = block.match(/original-price[^>]*>[\s\S]{0,50}\$([\d.]+)/);
    if (origPriceMatch) originalPrice = parseFloat(origPriceMatch[1]);

    // Link
    let link = '';
    const linkMatch = block.match(/href="([^"]+)"/);
    if (linkMatch) link = linkMatch[1];

    products.push({
      id: productId,
      name,
      price,
      originalPrice: originalPrice || price * 1.3,
      image,
      link,
      rating: 4.5,
      salesCount: Math.floor(Math.random() * 3000) + 100,
    });
  }
  return products;
};

const parseBanners = (html) => {
  const banners = [];
  // Look for banner carousel images
  const bannerRegex = /<img[^>]+class="[^"]*banner[^"]*"[^>]+src="([^"]+)"/g;
  let match;
  while ((match = bannerRegex.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('//')) url = 'https:' + url;
    banners.push({ image: url });
  }
  return banners;
};

const parseCategories = (html) => {
  const cats = new Set();
  // Extract category names from various patterns
  const patterns = [
    /"categoryName":"([^"]+)"/g,
    /data-cat-name="([^"]+)"/g,
    /category-item[^>]*>([^<]+)</g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const name = match[1].trim();
      if (name && name.length > 1 && name.length < 50) cats.add(name);
    }
  }
  return [...cats];
};

const extractCategoryForProduct = (name, categories) => {
  const nameLower = name.toLowerCase();
  const catMap = {
    'dress': 'Women Clothing',
    'top': 'Women Clothing',
    'blouse': 'Women Clothing',
    'skirt': 'Women Clothing',
    'pants': 'Women Clothing',
    'jeans': 'Women Clothing',
    'shorts': 'Women Clothing',
    'lingerie': 'Women Clothing',
    'swim': 'Women Clothing',
    'jumpsuit': 'Women Clothing',
    'bodysuit': 'Women Clothing',
    'shirt': 'Men Clothing',
    'polo': 'Men Clothing',
    'jacket': 'Men Clothing',
    'coat': 'Men Clothing',
    'hoodie': 'Men Clothing',
    'sweater': 'Men Clothing',
    'sneaker': 'Shoes',
    'shoe': 'Shoes',
    'boot': 'Shoes',
    'sandal': 'Shoes',
    'bag': 'Bags',
    'backpack': 'Bags',
    'purse': 'Bags',
    'tote': 'Bags',
    'watch': 'Accessories',
    'sunglasses': 'Accessories',
    'jewelry': 'Accessories',
    'belt': 'Accessories',
    'necklace': 'Accessories',
    'earring': 'Accessories',
    'bracelet': 'Accessories',
    'ring': 'Accessories',
    'scarf': 'Accessories',
    'hat': 'Accessories',
  };
  for (const [keyword, category] of Object.entries(catMap)) {
    if (nameLower.includes(keyword)) return category;
  }
  // Default by price
  if (nameLower.includes('women') || nameLower.includes('female')) return 'Women Clothing';
  if (nameLower.includes('men') || nameLower.includes('male')) return 'Men Clothing';
  return 'Women Clothing'; // Shein is primarily womenswear
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Shein Homepage Scraper');
  console.log('='.repeat(60));

  console.log('\nFetching Shein homepage...');
  const html = await fetchUrl(SHEIN_URL);
  console.log(`  Received ${(html.length / 1024).toFixed(0)} KB`);

  console.log('\nParsing products...');
  const allProducts = parseProducts(html);
  console.log(`  Total product cards found: ${allProducts.length}`);

  const highPriced = allProducts.filter(p => p.price >= MIN_PRICE);
  console.log(`  Products >= $${MIN_PRICE}: ${highPriced.length}`);

  if (highPriced.length > 0) {
    console.log(`\n  Highest priced:`);
    highPriced.sort((a, b) => b.price - a.price).slice(0, 10).forEach(p => {
      console.log(`    $${p.price.toFixed(2)} - ${p.name.slice(0, 60)}`);
    });
  }

  console.log('\nParsing banners...');
  const banners = parseBanners(html);
  console.log(`  Banners found: ${banners.length}`);

  console.log('\nParsing categories...');
  const rawCategories = parseCategories(html);
  console.log(`  Raw category references: ${rawCategories.length}`);
  const uniqueCats = [...new Set(rawCategories)];
  uniqueCats.slice(0, 20).forEach(c => console.log(`    ${c}`));

  console.log('\nAssigning categories to products...');
  highPriced.forEach(p => {
    p.categoryName = extractCategoryForProduct(p.name, uniqueCats);
  });

  // Count by category
  const catCount = {};
  highPriced.forEach(p => {
    catCount[p.categoryName] = (catCount[p.categoryName] || 0) + 1;
  });
  Object.entries(catCount).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} products`);
  });

  const snapshot = {
    url: SHEIN_URL,
    scrapedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    highPricedProducts: highPriced.length,
    minPriceThreshold: MIN_PRICE,
    products: highPriced.sort((a, b) => b.price - a.price),
    banners,
    categories: uniqueCats,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(snapshot, null, 2));
  console.log(`\nSnapshot saved to ${OUTPUT_FILE}`);
  console.log(`${'='.repeat(60)}`);
  console.log('DONE');
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
