/**
 * import_shein_products.js
 *
 * Imports Shein-inspired high-priced products ($200-$4,999) alongside existing catalog.
 * Uses Shein-style product naming and our 26-category structure.
 *
 * Run: node scripts/import_shein_products.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const request = (url, method, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const isPost = method === 'POST';
  const body = isPost ? JSON.stringify(data) : null;
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + (isPost ? '' : u.search),
    method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ImportScript/1.0)',
      ...(isPost ? { 'Content-Type': 'application/json' } : {}),
      'Authorization': token ? `Bearer ${token}` : '',
      'token': token || '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  if (isPost) opts.headers['Content-Length'] = Buffer.byteLength(body);
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  if (isPost) req.write(body);
  req.end();
});

const getJSON = (url, token) => request(url, 'GET', null, token);
const postJSON = (url, data, token) => request(url, 'POST', data, token);

const pixabaySearch = (query, perPage = 3) => new Promise((resolve, reject) => {
  const encoded = encodeURIComponent(query);
  const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encoded}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${perPage}`;
  const u = new URL(url);
  const opts = {
    hostname: u.hostname, port: 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImportScript/1.0)' },
    timeout: 15000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0, 200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Map Shein categories to our DB L2 categories
// Our DB has: Shoes, Men Clothing, Women Clothing, Bags, Accessories,
// Smartphones, Laptops, Headphones, Television, Bluetooth Speakers, Speakers,
// Apple Watch, Furniture, Skincare, Makeup, Fitness (16 L2)
const SHEIN_TO_DB = {
  'New In': 'Women Clothing',
  'Sale': 'Women Clothing',
  'Women Clothing': 'Women Clothing',
  'Beachwear': 'Women Clothing',
  'Kids': 'Women Clothing',
  'Curve': 'Women Clothing',
  'Men Clothing': 'Men Clothing',
  'Shoes': 'Shoes',
  'Underwear & Sleepwear': 'Women Clothing',
  'Home & Living': 'Furniture',
  'Jewelry & Accessories': 'Accessories',
  'Beauty & Health': 'Skincare',
  'Baby & Maternity': 'Women Clothing',
  'Bags & Luggage': 'Bags',
  'Sports & Outdoors': 'Fitness',
  'Home Textiles': 'Furniture',
  'Cell Phones & Accessories': 'Smartphones',
  'Electronics': 'Headphones',
  'Toys & Games': 'Accessories',
  'Tools & Home Improvement': 'Furniture',
  'Office & School Supplies': 'Accessories',
  'Pet Supplies': 'Accessories',
  'Appliances': 'Furniture',
  'Automotive': 'Accessories',
  'Books & Magazine': 'Accessories',
  'Food & Beverages': 'Accessories',
};

// Products inspired by Shein's catalog but wholesale-priced ($200-$4,999)
const sheinProducts = (catMap) => {
  const products = [];
  const ID = catMap; // name -> _id

  const add = (name, sheinCategory, price, desc, tags, rating) => {
    const dbCat = SHEIN_TO_DB[sheinCategory] || 'Accessories';
    const catId = ID[dbCat];
    if (!catId) {
      console.error(`  WARN: Category "${dbCat}" (from "${sheinCategory}") not found, skipping "${name}"`);
      return;
    }
    products.push({
      name, categoryId: catId, price,
      description: desc || `Premium wholesale ${name} — Shein-inspired design. High quality, bulk available. Rated ${rating} stars.`,
      tags: tags || [],
      rating: rating || 4.7,
      salesCount: Math.floor(Math.random() * 8000) + 500,
      reviewCount: Math.floor((rating || 4.7) * 60),
      originalPrice: Math.round(price * (1 + Math.random() * 0.5)),
      stock: Math.floor(Math.random() * 1000) + 100,
    });
  };

  // ==================== WOMEN CLOTHING ====================
  add('SHEIN Premium Satin Midi Slip Dress', 'Women Clothing', 499, 'Luxury satin slip dress with cowl neck — perfect for evening wholesale bulk orders', ['shein','dress','satin','womens'], 4.8);
  add('SHEIN Moda Luxe Knit Co-Ord Set', 'Women Clothing', 599, 'Two-piece knit set — oversized cardigan + crop top + wide-leg pants, premium fabrication', ['shein','co-ord','knit','womens'], 4.7);
  add('SHEIN Premium Tailored Blazer Dress', 'Women Clothing', 789, 'Structured blazer dress with belt, office-to-evening versatility, wholesale bulk', ['shein','blazer','dress','womens'], 4.8);
  add('SHEIN EZwear Premium Faux Fur Coat', 'Women Clothing', 899, 'Ultra-soft faux fur long coat, perfect for luxury wholesale collections', ['shein','coat','faux fur','womens'], 4.7);
  add('SHEIN Premium Leather Moto Jacket', 'Women Clothing', 999, 'Genuine lambskin leather moto jacket, asymmetrical zip, premium wholesale', ['shein','leather','jacket','womens'], 4.9);
  add('SHEIN Moda Premium Silk Blouse', 'Women Clothing', 345, '100% mulberry silk blouse with French cuffs, wholesale luxury top', ['shein','silk','blouse','womens'], 4.8);
  add('SHEIN Premium High-Waist Palazzo Pants', 'Women Clothing', 289, 'Full-length wide-leg palazzo pants, premium crepe fabric, bulk wholesale', ['shein','palazzo','pants','womens'], 4.7);
  add('SHEIN Luxe Cashmere Wrap Cardigan', 'Women Clothing', 599, 'Pure cashmere longline cardigan wrap, 4-ply gauge, wholesale luxury knitwear', ['shein','cashmere','cardigan','womens'], 4.9);
  add('SHEIN Premium Sequin Evening Gown', 'Women Clothing', 1299, 'Full-length sequin gown with plunging V-neck, red carpet quality, bulk wholesale', ['shein','gown','sequin','womens'], 4.8);
  add('SHEIN Premium Structured Corset Top', 'Women Clothing', 399, 'Boned corset top with satin finish, couture-level construction, wholesale', ['shein','corset','top','womens'], 4.7);

  // ==================== MEN CLOTHING ====================
  add('SHEIN Premium Tailored Wool Suit', 'Men Clothing', 1499, 'Two-button wool suit with flat-front trousers, half-canvas construction, bulk wholesale', ['shein','suit','wool','mens'], 4.9);
  add('SHEIN Premium Leather Biker Jacket', 'Men Clothing', 1199, 'Cowhide leather biker jacket with quilted shoulders, wholesale motorcycle style', ['shein','leather','jacket','biker','mens'], 4.8);
  add('SHEIN Premium Cashmere Overcoat', 'Men Clothing', 1999, 'Double-breasted cashmere overcoat, peak lapels, luxury wholesale outerwear', ['shein','overcoat','cashmere','mens'], 4.9);
  add('SHEIN Premium Linen Blend Suit', 'Men Clothing', 899, 'Lightweight linen-cotton blend suit, unlined jacket, perfect for summer wholesale', ['shein','linen','suit','mens'], 4.7);
  add('SHEIN Premium Oxford Button-Down Shirt', 'Men Clothing', 299, 'Premium oxford cloth button-down, mother-of-pearl buttons, bulk wholesale', ['shein','oxford','shirt','mens'], 4.8);
  add('SHEIN Premium Wool Trousers', 'Men Clothing', 399, 'Italian wool flat-front trousers, belt loops, wholesale dress pants', ['shein','trousers','wool','mens'], 4.7);
  add('SHEIN Premium Down Puffer Jacket', 'Men Clothing', 799, '700-fill goose down puffer jacket with hood, wholesale winter outerwear', ['shein','puffer','down','jacket','mens'], 4.8);
  add('SHEIN Premium Merino Crewneck Sweater', 'Men Clothing', 349, 'Extra-fine merino wool crewneck, 12-gauge knit, wholesale bulk', ['shein','merino','sweater','mens'], 4.7);
  add('SHEIN Premium Tuxedo Set', 'Men Clothing', 2499, 'Peak lapel tuxedo with satin trim, pleated trousers, black-tie wholesale', ['shein','tuxedo','formal','mens'], 4.9);
  add('SHEIN Premium Utility Cargo Pants', 'Men Clothing', 329, 'Heavyweight cotton cargo pants with multiple pockets, wholesale bulk', ['shein','cargo','pants','mens'], 4.7);

  // ==================== SHOES ====================
  add('SHEIN Premium Platform Chunky Sneakers', 'Shoes', 399, 'Treaded platform sneakers with padded collar, wholesale bulk footwear', ['shein','sneakers','platform','shoes'], 4.7);
  add('SHEIN Premium Leather Chelsea Boots', 'Shoes', 599, 'Genuine leather Chelsea boots with elastic panels, wholesale luxury boots', ['shein','chelsea','boots','leather'], 4.8);
  add('SHEIN Premium Stiletto Heels', 'Shoes', 449, 'Pointed-toe stiletto heels with ankle strap, wholesale premium pumps', ['shein','heels','stiletto','shoes'], 4.7);
  add('SHEIN Premium Leather Loafers', 'Shoes', 499, 'Italian leather driving loafers with metal bit detail, wholesale bulk', ['shein','loafers','leather','shoes'], 4.8);
  add('SHEIN Premium Combat Boots', 'Shoes', 549, 'Lace-up combat boots with chunky tread, wholesale tactical style', ['shein','combat','boots','shoes'], 4.7);
  add('SHEIN Premium Knee-High Riding Boots', 'Shoes', 899, 'Smooth leather knee-high riding boots with low block heel, wholesale', ['shein','riding','boots','leather'], 4.8);
  add('SHEIN Premium Slide Sandals', 'Shoes', 299, 'Cushioned slide sandals with premium leather strap, wholesale casual', ['shein','slides','sandals','shoes'], 4.7);
  add('SHEIN Premium Running Sneakers', 'Shoes', 399, 'Performance running sneakers with responsive cushioning, wholesale bulk', ['shein','running','sneakers','shoes'], 4.7);

  // ==================== BAGS & LUGGAGE ====================
  add('SHEIN Premium Quilted Chain Shoulder Bag', 'Bags & Luggage', 699, 'Quilted lambskin leather shoulder bag with chain strap, wholesale luxury bag', ['shein','bag','quilted','shoulder'], 4.8);
  add('SHEIN Premium Leather Tote Bag', 'Bags & Luggage', 799, 'Full-grain leather large tote with interior pockets, wholesale bulk order', ['shein','tote','leather','bag'], 4.9);
  add('SHEIN Premium Top Handle Satchel', 'Bags & Luggage', 599, 'Structured top handle satchel with detachable crossbody strap, wholesale', ['shein','satchel','bag'], 4.7);
  add('SHEIN Premium Belt Bag', 'Bags & Luggage', 349, 'Nylon belt bag with adjustable strap, wholesale hands-free style', ['shein','belt bag','crossbody'], 4.7);
  add('SHEIN Premium Hardshell Carry-On Luggage', 'Bags & Luggage', 1299, 'Polycarbonate hardshell carry-on with spinner wheels, wholesale travel', ['shein','luggage','carry-on'], 4.8);
  add('SHEIN Premium Large Checked Suitcase', 'Bags & Luggage', 1899, 'TSA-approved hardshell suitcase, 4 spinner wheels, wholesale bulk', ['shein','suitcase','luggage'], 4.8);
  add('SHEIN Premium Laptop Backpack', 'Bags & Luggage', 499, 'Padded laptop backpack with USB charging port, wholesale bulk order', ['shein','backpack','laptop'], 4.7);

  // ==================== JEWELRY & ACCESSORIES ====================
  add('SHEIN Premium Gold-Plated Hoop Earrings', 'Jewelry & Accessories', 299, '18k gold-plated sterling silver hoop earrings, wholesale bulk jewelry', ['shein','earrings','gold','jewelry'], 4.8);
  add('SHEIN Premium Stainless Steel Watch', 'Jewelry & Accessories', 899, 'Japanese quartz movement, stainless steel case, sapphire crystal, wholesale watch', ['shein','watch','steel'], 4.8);
  add('SHEIN Premium Pearl Necklace Set', 'Jewelry & Accessories', 599, 'Freshwater pearl necklace with matching earrings, wholesale jewelry set', ['shein','pearl','necklace','jewelry'], 4.7);
  add('SHEIN Premium Leather Belt', 'Jewelry & Accessories', 249, 'Italian calfskin leather belt with brushed buckle, wholesale bulk', ['shein','belt','leather'], 4.7);
  add('SHEIN Premium Silk Scarf', 'Jewelry & Accessories', 299, '100% silk twll scarf with hand-rolled edges, wholesale accessories', ['shein','scarf','silk'], 4.8);
  add('SHEIN Premium Designer Sunglasses', 'Jewelry & Accessories', 399, 'UV400 polarized lens sunglasses with acetate frame, wholesale bulk', ['shein','sunglasses','polarized'], 4.7);

  // ==================== ELECTRONICS ====================
  add('SHEIN Premium Wireless Earbuds', 'Electronics', 499, 'Active noise canceling earbuds, 8hr battery, IPX5, wholesale bulk electronics', ['shein','earbuds','wireless','audio'], 4.7);
  add('SHEIN Premium Bluetooth Speaker', 'Electronics', 599, 'Portable waterproof speaker with 360° sound, 20hr battery, wholesale', ['shein','speaker','bluetooth'], 4.7);
  add('SHEIN Premium Smart Watch', 'Electronics', 899, 'AMOLED display, heart rate/SpO2/BP monitoring, 14-day battery, wholesale', ['shein','smartwatch','fitness'], 4.7);
  add('SHEIN Premium Tablet Stand', 'Electronics', 249, 'Adjustable aluminum tablet stand with cable management, wholesale bulk', ['shein','stand','tablet'], 4.7);

  // ==================== BEAUTY & HEALTH ====================
  add('SHEIN Premium Vitamin C Serum Set', 'Beauty & Health', 399, '20% Vitamin C + hyaluronic acid serum set, professional grade, wholesale', ['shein','serum','skincare','vitamin c'], 4.8);
  add('SHEIN Premium Retinol Night Cream', 'Beauty & Health', 349, 'Encapsulated retinol night cream with peptides, wholesale bulk skincare', ['shein','retinol','cream','skincare'], 4.7);
  add('SHEIN Premium Hair Dryer', 'Beauty & Health', 699, 'Ionic hair dryer with concentrator and diffuser, wholesale bulk beauty', ['shein','hair dryer','beauty'], 4.7);
  add('SHEIN Premium Makeup Brush Set', 'Beauty & Health', 299, '12-piece synthetic brush set, cruelty-free, wholesale bulk makeup', ['shein','brushes','makeup'], 4.8);
  add('SHEIN Premium LED Face Mask', 'Beauty & Health', 899, 'LED light therapy face mask with 7 colors, wholesale skincare device', ['shein','led mask','skincare'], 4.7);

  // ==================== HOME & LIVING ====================
  add('SHEIN Premium Scented Candle Collection', 'Home & Living', 299, 'Soy wax candle set with 3 scents, 60-hr burn time, wholesale bulk', ['shein','candle','home decor'], 4.7);
  add('SHEIN Premium Throw Blanket', 'Home & Living', 349, 'Vegan cashmere throw blanket with fringe, wholesale home textile', ['shein','blanket','throw','home'], 4.8);
  add('SHEIN Premium Decorative Vase Set', 'Home & Living', 399, 'Ceramic vase set with matte finish, modern design, wholesale decor', ['shein','vases','home decor'], 4.7);
  add('SHEIN Premium Memory Foam Pillows', 'Home & Living', 499, 'Queen-size memory foam pillow with cooling gel layer, wholesale bedding', ['shein','pillow','memory foam'], 4.8);
  add('SHEIN Premium Electric Blanket', 'Home & Living', 699, 'Heated electric blanket with 10 settings, auto shut-off, wholesale bulk', ['shein','blanket','electric'], 4.7);
  add('SHEIN Premium Room Diffuser Set', 'Home & Living', 249, 'Reed diffuser with 500ml essential oil, luxury scent, wholesale home', ['shein','diffuser','home fragrance'], 4.7);

  // ==================== SPORTS & OUTDOORS ====================
  add('SHEIN Premium Yoga Mat', 'Sports & Outdoors', 399, 'Extra-thick alignment yoga mat with carrying strap, wholesale fitness', ['shein','yoga','mat','fitness'], 4.8);
  add('SHEIN Premium Dumbbell Set', 'Sports & Outdoors', 899, 'Adjustable dumbbell set 2x25lbs, premium rubber coating, wholesale gym', ['shein','dumbbells','fitness'], 4.7);
  add('SHEIN Premium Resistance Bands', 'Sports & Outdoors', 299, 'Set of 5 resistance bands with different tensions, wholesale fitness bulk', ['shein','resistance','bands','fitness'], 4.7);
  add('SHEIN Premium Camping Tent', 'Sports & Outdoors', 1299, '4-person waterproof camping tent with rainfly, wholesale outdoor gear', ['shein','tent','camping'], 4.7);
  add('SHEIN Premium Insulated Water Bottle', 'Sports & Outdoors', 299, 'Double-wall vacuum insulated 32oz bottle, wholesale sports accessories', ['shein','bottle','insulated'], 4.8);

  // ==================== UNDERWEAR & SLEEPWEAR ====================
  add('SHEIN Premium Silk Pajama Set', 'Underwear & Sleepwear', 599, '100% mulberry silk pajama set with button front, wholesale luxury sleepwear', ['shein','pajama','silk'], 4.8);
  add('SHEIN Premium Lace Lingerie Set', 'Underwear & Sleepwear', 399, 'French lace bralette and high-waist panty set, wholesale bulk intimate', ['shein','lingerie','lace'], 4.7);
  add('SHEIN Premium Cotton Robe', 'Underwear & Sleepwear', 349, 'Turkish cotton waffle robe with belt, wholesale bathrobe bulk', ['shein','robe','cotton'], 4.8);
  add('SHEIN Premium Seamless Shapewear', 'Underwear & Sleepwear', 299, 'High-compression seamless bodysuit shapewear, wholesale bulk', ['shein','shapewear','bodysuit'], 4.7);

  // ==================== CELL PHONES & ACCESSORIES ====================
  add('SHEIN Premium Leather Phone Case', 'Cell Phones & Accessories', 249, 'Genuine leather phone case with card holder, wholesale bulk accessories', ['shein','phone case','leather'], 4.7);
  add('SHEIN Premium Wireless Charger', 'Cell Phones & Accessories', 399, '15W fast wireless charging pad with LED indicator, wholesale bulk', ['shein','charger','wireless'], 4.7);
  add('SHEIN Premium Pop Grip Phone Holder', 'Cell Phones & Accessories', 199, 'Expandable phone grip holder with swivel base, wholesale bulk', ['shein','pop grip','phone', 'holder'], 4.7);

  // ==================== KIDS ====================
  add('SHEIN Premium Kids Down Coat', 'Kids', 399, 'Kids 600-fill goose down coat with detachable hood, wholesale children', ['shein','kids','coat','down'], 4.8);
  add('SHEIN Premium Kids Cashmere Sweater', 'Kids', 299, 'Fine merino kids sweater with Fair Isle pattern, wholesale children bulk', ['shein','kids','sweater','cashmere'], 4.7);
  add('SHEIN Premium Baby Gift Set', 'Baby & Maternity', 299, 'Newborn baby gift set with onesie, hat, mittens, blanket, wholesale', ['shein','baby','gift set'], 4.8);
  add('SHEIN Premium Maternity Support Belt', 'Baby & Maternity', 249, 'Adjustable maternity belly support belt with breathable fabric, wholesale', ['shein','maternity','support','belt'], 4.7);

  // ==================== HOME TEXTILES ====================
  add('SHEIN Premium Egyptian Cotton Sheet Set', 'Home Textiles', 599, '1000-thread count Egyptian cotton fitted sheet set, wholesale bedding', ['shein','sheets','cotton','bedding'], 4.9);
  add('SHEIN Premium Down Comforter', 'Home Textiles', 899, 'All-season goose down comforter with baffle-box construction, wholesale', ['shein','comforter','down'], 4.8);
  add('SHEIN Premium Weighted Blanket', 'Home Textiles', 699, '15lb weighted blanket with glass bead fill, wholesale home textile', ['shein','weighted','blanket'], 4.7);

  // ==================== TOYS & GAMES ====================
  add('SHEIN Premium Plush Teddy Bear', 'Toys & Games', 299, 'Giant 40-inch plush teddy bear with ultra-soft fur, wholesale toy', ['shein','teddy','plush','toy'], 4.8);
  add('SHEIN Premium Building Block Set', 'Toys & Games', 599, '1000-piece architecture building block set, wholesale educational toy', ['shein','building','blocks','toy'], 4.7);
  add('SHEIN Premium Remote Control Car', 'Toys & Games', 399, 'RC off-road truck with rechargeable battery, wholesale toy vehicle', ['shein','rc car','remote'], 4.7);

  // ==================== HOME APPLIANCES ====================
  add('SHEIN Premium Air Fryer', 'Appliances', 899, '5.8QT digital air fryer with 8 presets, non-stick basket, wholesale', ['shein','air fryer','kitchen'], 4.8);
  add('SHEIN Premium Robot Vacuum', 'Appliances', 1299, 'LiDAR navigation robot vacuum with mopping, Wi-Fi app, wholesale', ['shein','robot','vacuum'], 4.7);
  add('SHEIN Premium Espresso Machine', 'Appliances', 1999, '15-bar espresso machine with steam wand, professional-grade, wholesale', ['shein','espresso','coffee'], 4.8);
  add('SHEIN Premium Stand Mixer', 'Appliances', 1499, '5.5QT tilt-head stand mixer with 12 speeds, wholesale kitchen appliance', ['shein','mixer','kitchen'], 4.7);

  // ==================== PET SUPPLIES ====================
  add('SHEIN Premium Pet Bed', 'Pet Supplies', 399, 'Orthopedic memory foam pet bed with washable cover, wholesale pet', ['shein','pet','bed'], 4.8);
  add('SHEIN Premium Pet Carrier', 'Pet Supplies', 349, 'Airline-approved soft-sided pet carrier with fleece bed, wholesale', ['shein','pet','carrier'], 4.7);
  add('SHEIN Premium Dog Harness Set', 'Pet Supplies', 249, 'No-pull harness with leash set, adjustable straps, wholesale pet', ['shein','harness','dog'], 4.7);

  // ==================== AUTOMOTIVE ====================
  add('SHEIN Premium Car Seat Cover Set', 'Automotive', 399, 'Leather car seat covers set for 5 seats, universal fit, wholesale auto', ['shein','car seat','cover'], 4.7);
  add('SHEIN Premium Dash Camera', 'Automotive', 499, '4K dash cam with night vision, wide angle, G-sensor, wholesale auto', ['shein','dash cam'], 4.8);
  add('SHEIN Premium Car Vacuum Cleaner', 'Automotive', 299, 'Handheld cordless vacuum with HEPA filter, wholesale car accessory', ['shein','vacuum','car'], 4.7);

  return products;
};

async function main() {
  console.log('=== SHEIN Premium Product Import ===\n');
  console.log('Logging in as admin...');
  const loginUrl = `${API}/main/sendMsg/login`;
  const loginRes = await postJSON(loginUrl, {
    username: USERNAME, password: PASSWORD
  });
  const token = loginRes?.data?.token || loginRes?.token;
  if (!token) {
    console.error('Login failed. Response:', JSON.stringify(loginRes).slice(0, 300));
    process.exit(1);
  }
  console.log('Logged in successfully, token acquired.\n');

  // Fetch current categories
  console.log('Fetching categories from /home/admin/categories...');
  const catsRes = await getJSON(`${API}/home/admin/categories`, token);

  let cats = [];
  if (catsRes?.data) {
    cats = Array.isArray(catsRes.data) ? catsRes.data : [];
  }

  if (cats.length === 0) {
    console.error('Could not fetch categories. Response:', JSON.stringify(catsRes).slice(0, 300));
    process.exit(1);
  }

  console.log(`Found ${cats.length} categories in database.\n`);
  // Build category name -> ID map (L2 categories only, or by exact name match)
  const catMap = {};
  for (const c of cats) {
    const name = c.name || '';
    catMap[name] = c._id;
    // Also map by lowercase
    const lower = name.toLowerCase();
    for (const s of ['Shoes', 'Men Clothing', 'Women Clothing', 'Bags', 'Accessories',
      'Smartphones', 'Laptops', 'Headphones', 'Television', 'Bluetooth Speakers',
      'Speakers', 'Apple Watch', 'Furniture', 'Skincare', 'Makeup', 'Fitness']) {
      if (lower === s.toLowerCase()) {
        catMap[s] = c._id;
      }
    }
  }
  console.log('Category map:', JSON.stringify(catMap, null, 2));

  // Generate products
  console.log('\nGenerating Shein-inspired products...');
  const products = sheinProducts(catMap);
  console.log(`Generated ${products.length} premium products.\n`);

  // Fetch Pixabay images for each product
  console.log('Fetching images from Pixabay...');
  let successCount = 0;
  const batchSize = 5;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const promises = batch.map(async (p) => {
      try {
        const keys = (p.tags || []).concat(p.name.toLowerCase().split(/\s+/).slice(0, 5));
        const query = keys.join(' ').slice(0, 100);
        const result = await pixabaySearch(query, 3);
        if (result && result.hits && result.hits.length > 0) {
          p.images = result.hits.slice(0, 3).map(h => h.webformatURL || h.largeImageURL || h.previewURL || '');
          p.image = p.images[0] || '';
        } else {
          // Fallback: simpler query
          const fallback = await pixabaySearch(keys.slice(0, 3).join(' '), 3);
          if (fallback && fallback.hits && fallback.hits.length > 0) {
            p.images = fallback.hits.slice(0, 3).map(h => h.webformatURL || h.largeImageURL || h.previewURL || '');
            p.image = p.images[0] || '';
          }
        }
        if (p.images && p.images.length > 0) successCount++;
        await sleep(300);
      } catch (e) {
        console.error(`  Image fetch error for "${p.name.slice(0, 30)}": ${e.message}`);
      }
    });
    await Promise.all(promises);
    console.log(`  Progress: ${Math.min(i + batchSize, products.length)}/${products.length} (${successCount} with images)`);
  }

  console.log(`\nTotal products with images: ${successCount}/${products.length}`);

  // Build the bulk import payload
  const payload = {
    products: products.map(p => ({
      name: p.name,
      description: p.description,
      images: p.images || [],
      categoryId: p.categoryId,
      price: Math.round(p.price),
      originalPrice: p.originalPrice,
      salesCount: p.salesCount,
      reviewCount: p.reviewCount,
      rating: p.rating,
      tags: p.tags || [],
      isHot: true,
      isRecommended: true,
      stock: p.stock,
      skus: [{
        attrs: [{ name: 'Size', value: 'Standard' }, { name: 'Color', value: 'As Pictured' }],
        price: Math.round(p.price * 0.9),
        originalPrice: p.originalPrice,
        stock: p.stock,
        image: (p.images && p.images[0]) || '',
      }, {
        attrs: [{ name: 'Size', value: 'Premium' }, { name: 'Color', value: 'As Pictured' }],
        price: Math.round(p.price * 1.1),
        originalPrice: Math.round(p.originalPrice * 1.15),
        stock: Math.floor(p.stock * 0.7),
        image: (p.images && p.images[1]) || (p.images && p.images[0]) || '',
      }],
    }))
  };

  console.log(`\nBulk importing ${payload.products.length} products...`);

  // Try bulk import
  const endpoints = [
    '/home/admin/bulk-import-products',
    '/home/admin/products/bulk',
    '/home/product/bulk',
  ];
  let importRes = null;
  for (const ep of endpoints) {
    try {
      importRes = await postJSON(`${API}${ep}`, payload, token);
      if (importRes && importRes.success !== false) break;
    } catch(e) { continue; }
  }

  if (importRes && importRes.success !== false) {
    console.log('Import succeeded!');
    console.log(JSON.stringify(importRes).slice(0, 300));
  } else {
    console.log('Bulk import response:', JSON.stringify(importRes).slice(0, 300));
    // Try importing one by one
    console.log('Trying individual product import...');
    let individualSuccess = 0;
    for (const p of payload.products) {
      for (const ep of ['/home/admin/product/create', '/home/admin/products', '/home/product/create']) {
        try {
          const r = await postJSON(`${API}${ep}`, p, token);
          if (r && r.success !== false) { individualSuccess++; break; }
        } catch(e) { continue; }
      }
      await sleep(200);
    }
    console.log(`Individual import: ${individualSuccess}/${payload.products.length} succeeded`);
  }

  // Summary
  console.log('\n=== IMPORT SUMMARY ===');
  console.log(`Products attempted: ${products.length}`);
  console.log(`With images: ${successCount}`);
  console.log(`Categories used: ${products.filter(p => p.categoryId).length}`);

  // Save product data to JSON for reference
  const outputPath = path.join(__dirname, 'shein_imported_products.json');
  fs.writeFileSync(outputPath, JSON.stringify({ products, importPayload: payload, importResponse: importRes }, null, 2));
  console.log(`\nFull data saved to ${outputPath}`);
  console.log('\nDone!');
}

main().catch(e => { console.error('Fatal error:', e.message); process.exit(1); });
