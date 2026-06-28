/**
 * import_200_products.js
 *
 * 1. Creates 6 new categories (Bags, Accessories, Television, Bluetooth Speakers, Speakers, Apple Watch)
 * 2. Imports 200 new products across all categories (80 Electronics, 60 Fashion, 60 Other)
 * 3. Fetches Pixabay images per product
 */
const https = require('https');

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
      'User-Agent': 'script/1.0',
      token: token || '',
      Authorization: token ? `Bearer ${token}` : '',
      'x-access-token': token || '',
    },
    timeout: 30000,
  };
  if (isPost) {
    opts.headers['Content-Type'] = 'application/json';
    opts.headers['Content-Length'] = Buffer.byteLength(body);
  }
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
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
    headers: { 'User-Agent': 'script/1.0' },
    timeout: 15000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const main = async () => {
  console.log('='.repeat(60));
  console.log('200 Products Import Script');
  console.log('='.repeat(60));

  // 1. Login as admin
  console.log('\n1. Logging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  // 2. Get existing categories to find parent IDs
  console.log('\n2. Fetching existing categories...');
  const catRes = await getJSON(`${API}/home/admin/categories`, token);
  if (catRes.code !== 0) {
    console.error('Failed to get categories:', catRes.msg);
    process.exit(1);
  }
  const categories = catRes.data || [];

  const findCat = (name, parentName) => {
    return categories.find(c =>
      c.name.toLowerCase() === name.toLowerCase() &&
      (!parentName || categories.find(p => p._id === (c.parentId?._id || c.parentId)?.toString?.() || p._id === c.parentId)?.name === parentName)
    );
  };

  const fashionParent = categories.find(c => c.name === 'Fashion' && c.level === 1);
  const electronicsParent = categories.find(c => c.name === 'Electronics' && c.level === 1);
  const homeParent = categories.find(c => c.name === 'Home & Living' && c.level === 1);
  const beautyParent = categories.find(c => c.name === 'Beauty' && c.level === 1);
  const sportsParent = categories.find(c => c.name === 'Sports' && c.level === 1);

  const existingCats = {
    menClothing: findCat('Men Clothing'),
    womenClothing: findCat('Women Clothing'),
    shoes: findCat('Shoes'),
    smartphones: findCat('Smartphones'),
    laptops: findCat('Laptops'),
    headphones: findCat('Headphones'),
    furniture: findCat('Furniture'),
    skincare: findCat('Skincare'),
    makeup: findCat('Makeup'),
    fitness: findCat('Fitness'),
  };

  console.log(`  Found ${categories.length} categories`);
  for (const [key, val] of Object.entries(existingCats)) {
    console.log(`    ${key}: ${val ? val._id + ' (' + val.name + ')' : 'NOT FOUND'}`);
  }

  const missing = Object.entries(existingCats).filter(([,v]) => !v);
  if (missing.length > 0) {
    console.error('Missing categories:', missing.map(([k]) => k).join(', '));
    process.exit(1);
  }

  // 3. Create 6 new categories
  console.log('\n3. Creating new categories...');
  const newCatDefs = [
    { name: 'Bags', parentId: fashionParent._id, level: 2, sort: 4 },
    { name: 'Accessories', parentId: fashionParent._id, level: 2, sort: 5 },
    { name: 'Television', parentId: electronicsParent._id, level: 2, sort: 4 },
    { name: 'Bluetooth Speakers', parentId: electronicsParent._id, level: 2, sort: 5 },
    { name: 'Speakers', parentId: electronicsParent._id, level: 2, sort: 6 },
    { name: 'Apple Watch', parentId: electronicsParent._id, level: 2, sort: 7 },
  ];

  const newCats = {};
  for (const def of newCatDefs) {
    process.stdout.write(`  Creating "${def.name}"... `);
    const res = await postJSON(`${API}/home/admin/add-category`, def, token);
    if (res.code === 0) {
      newCats[def.name] = res.data;
      console.log(`OK (${res.data._id})`);
    } else {
      console.log(`FAILED: ${res.msg}`);
    }
    await sleep(300);
  }

  // Build category ID map
  const CAT = {
    womenClothing: existingCats.womenClothing._id,
    menClothing: existingCats.menClothing._id,
    shoes: existingCats.shoes._id,
    smartphones: existingCats.smartphones._id,
    laptops: existingCats.laptops._id,
    headphones: existingCats.headphones._id,
    furniture: existingCats.furniture._id,
    skincare: existingCats.skincare._id,
    makeup: existingCats.makeup._id,
    fitness: existingCats.fitness._id,
    bags: newCats['Bags']?._id,
    accessories: newCats['Accessories']?._id,
    television: newCats['Television']?._id,
    bluetoothSpeakers: newCats['Bluetooth Speakers']?._id,
    speakers: newCats['Speakers']?._id,
    appleWatch: newCats['Apple Watch']?._id,
  };

  const missingNew = Object.entries(CAT).filter(([,v]) => !v && newCatDefs.some(d => d.name === Object.entries(newCats).find(([k]) => {
    const m = { bags: 'Bags', accessories: 'Accessories', television: 'Television', bluetoothSpeakers: 'Bluetooth Speakers', speakers: 'Speakers', appleWatch: 'Apple Watch' };
    return m[k] === k;
  })));
  console.log('\nCategory map ready');

  // 4. Define all product groups (200 products)
  console.log('\n4. Defining product groups...');
  const PRODUCT_GROUPS = [
    // === ELECTRONICS (80 products) ===
    // Smartphones — 12 products (brand-focused)
    {
      categoryId: CAT.smartphones, categoryName: 'Smartphones', pixabayQuery: 'smartphone technology',
      products: [
        { name: 'Apple iPhone 16 Pro Max 1TB', price: 1599, rating: 4.8 },
        { name: 'Apple iPhone 16 Pro 256GB', price: 1099, rating: 4.7 },
        { name: 'Samsung Galaxy S25 Ultra 1TB', price: 1399, rating: 4.7 },
        { name: 'Samsung Galaxy S25+ 512GB', price: 1099, rating: 4.6 },
        { name: 'Oppo Find X8 Ultra 512GB', price: 899, rating: 4.4 },
        { name: 'Oppo Reno 13 Pro 256GB', price: 599, rating: 4.3 },
        { name: 'LG G8 ThinQ 128GB', price: 499, rating: 4.1 },
        { name: 'LG V60 ThinQ 256GB', price: 649, rating: 4.2 },
        { name: 'Huawei P70 Pro 512GB', price: 999, rating: 4.5 },
        { name: 'Huawei Mate 70 Pro 512GB', price: 1099, rating: 4.6 },
        { name: 'Xiaomi 15 Pro 512GB', price: 799, rating: 4.5 },
        { name: 'Google Pixel 10 Pro 256GB', price: 999, rating: 4.6 },
      ],
    },
    // Laptops — 10 products
    {
      categoryId: CAT.laptops, categoryName: 'Laptops', pixabayQuery: 'laptop computer',
      products: [
        { name: 'Apple MacBook Pro 16" M4 Max 2TB', price: 3499, rating: 4.8 },
        { name: 'Microsoft Surface Laptop 7 13.8" 1TB', price: 1699, rating: 4.4 },
        { name: 'Framework Laptop 16 AMD 1TB', price: 1799, rating: 4.3 },
        { name: 'ASUS ZenBook Pro 16X OLED 1TB', price: 2299, rating: 4.5 },
        { name: 'Lenovo ThinkPad X1 Fold 16', price: 2499, rating: 4.2 },
        { name: 'Dell Precision 5680 Mobile Workstation', price: 2899, rating: 4.3 },
        { name: 'HP Dragonfly G4 13.5" 512GB', price: 1899, rating: 4.4 },
        { name: 'Acer Swift Edge 16 OLED 1TB', price: 1299, rating: 4.3 },
        { name: 'Razer Blade 18 RTX 4090 2TB', price: 3999, rating: 4.4 },
        { name: 'Gigabyte Aorus 17X RTX 4090 2TB', price: 3299, rating: 4.3 },
      ],
    },
    // Headphones — 8 products
    {
      categoryId: CAT.headphones, categoryName: 'Headphones', pixabayQuery: 'headphones audio',
      products: [
        { name: 'Focal Bathys Wireless Headphones', price: 699, rating: 4.6 },
        { name: 'Bowers & Wilkins Px8', price: 549, rating: 4.5 },
        { name: 'Master & Dynamic MW75', price: 599, rating: 4.4 },
        { name: 'Sony WH-1000XM5', price: 349, rating: 4.7 },
        { name: 'Bose 700 Headphones', price: 379, rating: 4.6 },
        { name: 'Sennheiser Momentum True Wireless 4', price: 299, rating: 4.5 },
        { name: 'JBL Tune 770NC', price: 129, rating: 4.2 },
        { name: 'Nothing Ear (2)', price: 149, rating: 4.3 },
      ],
    },
    // Television — 15 products
    {
      categoryId: CAT.television, categoryName: 'Television', pixabayQuery: 'television 4k tv',
      products: [
        { name: 'Samsung Neo QLED 8K QN900D 85"', price: 5999, rating: 4.7 },
        { name: 'Samsung Neo QLED 4K QN90D 75"', price: 2499, rating: 4.6 },
        { name: 'LG G4 OLED evo 77"', price: 3499, rating: 4.7 },
        { name: 'LG C4 OLED 65"', price: 1799, rating: 4.6 },
        { name: 'Sony Bravia XR A95L QD-OLED 65"', price: 2999, rating: 4.8 },
        { name: 'Sony X90L 4K Full Array LED 75"', price: 1799, rating: 4.5 },
        { name: 'TCL QM8 Mini-LED 85"', price: 1999, rating: 4.4 },
        { name: 'Hisense U8N Mini-LED 65"', price: 999, rating: 4.4 },
        { name: 'Panasonic OLED MZ2000 65"', price: 2499, rating: 4.6 },
        { name: 'Vizio P-Series Quantum X 75"', price: 1799, rating: 4.3 },
        { name: 'Samsung Frame QLED 65"', price: 1499, rating: 4.4 },
        { name: 'LG QNED85 Mini-LED 75"', price: 1999, rating: 4.3 },
        { name: 'Sony Bravia X80K 4K LED 75"', price: 999, rating: 4.2 },
        { name: 'TCL S5 4K LED 65"', price: 499, rating: 4.1 },
        { name: 'Samsung Crystal UHD DU8000 75"', price: 799, rating: 4.2 },
      ],
    },
    // Bluetooth Speakers — 15 products
    {
      categoryId: CAT.bluetoothSpeakers, categoryName: 'Bluetooth Speakers', pixabayQuery: 'bluetooth speaker portable',
      products: [
        { name: 'JBL Charge 5 Bluetooth Speaker', price: 149, rating: 4.6 },
        { name: 'JBL Flip 6 Bluetooth Speaker', price: 119, rating: 4.5 },
        { name: 'Sonos Roam 2 Portable Speaker', price: 179, rating: 4.4 },
        { name: 'Ultimate Ears BOOM 4', price: 149, rating: 4.5 },
        { name: 'Ultimate Ears MEGABOOM 4', price: 199, rating: 4.6 },
        { name: 'Bose SoundLink Flex (2nd Gen)', price: 149, rating: 4.5 },
        { name: 'Bose SoundLink Max', price: 399, rating: 4.6 },
        { name: 'Marshall Emberton III', price: 169, rating: 4.4 },
        { name: 'Marshall Middleton', price: 299, rating: 4.4 },
        { name: 'Sony SRS-XB100 Portable', price: 59, rating: 4.2 },
        { name: 'Sony SRS-XG300 Party Speaker', price: 299, rating: 4.4 },
        { name: 'Anker Soundcore Boom 2', price: 99, rating: 4.5 },
        { name: 'Anker Soundcore Motion 300', price: 79, rating: 4.4 },
        { name: 'Bang & Olufsen Beosound A1 (2nd Gen)', price: 279, rating: 4.5 },
        { name: 'Harman Kardon Go+ Play 3', price: 329, rating: 4.3 },
      ],
    },
    // Speakers (wired/home theater) — 10 products
    {
      categoryId: CAT.speakers, categoryName: 'Speakers', pixabayQuery: 'speaker home theater',
      products: [
        { name: 'Sonos Era 300 Smart Speaker', price: 449, rating: 4.6 },
        { name: 'Sonos Era 100 Smart Speaker', price: 249, rating: 4.5 },
        { name: 'Bose Home Speaker 500', price: 389, rating: 4.4 },
        { name: 'Harman Kardon Citation 500', price: 399, rating: 4.3 },
        { name: 'KEF LS50 Wireless II Bookshelf Speakers', price: 2499, rating: 4.7 },
        { name: 'Bowers & Wilkins Zeppelin', price: 799, rating: 4.5 },
        { name: 'Marshall Stanmore III', price: 379, rating: 4.4 },
        { name: 'Dali Oberon 5 Floorstanding Speakers', price: 1499, rating: 4.6 },
        { name: 'Yamaha NS-800A Bookshelf Speakers', price: 999, rating: 4.4 },
        { name: 'Klipsch RP-600M II Bookshelf Speakers', price: 599, rating: 4.5 },
      ],
    },
    // Apple Watch — 10 products
    {
      categoryId: CAT.appleWatch, categoryName: 'Apple Watch', pixabayQuery: 'apple watch smartwatch',
      products: [
        { name: 'Apple Watch Ultra 3 49mm Titanium', price: 799, rating: 4.7 },
        { name: 'Apple Watch Series 10 46mm Aluminum', price: 499, rating: 4.6 },
        { name: 'Apple Watch Series 10 42mm Aluminum', price: 449, rating: 4.6 },
        { name: 'Apple Watch SE (3rd Gen) 44mm', price: 299, rating: 4.4 },
        { name: 'Apple Watch SE (3rd Gen) 40mm', price: 269, rating: 4.4 },
        { name: 'Apple Watch Ultra 2 49mm', price: 749, rating: 4.6 },
        { name: 'Apple Watch Series 9 45mm Stainless Steel', price: 599, rating: 4.5 },
        { name: 'Apple Watch Series 9 41mm Stainless Steel', price: 549, rating: 4.5 },
        { name: 'Apple Watch Nike Series 10 46mm', price: 499, rating: 4.5 },
        { name: 'Apple Watch Hermès Series 10 42mm', price: 1249, rating: 4.6 },
      ],
    },
    // === FASHION (60 products) ===
    // Women Clothing — 12 products
    {
      categoryId: CAT.womenClothing, categoryName: "Women's Clothing", pixabayQuery: 'women fashion clothing',
      products: [
        { name: 'Zara Women Layered Mini Dress', price: 69, rating: 4.2 },
        { name: 'H&M Women Premium Linen Blazer', price: 99, rating: 4.3 },
        { name: 'Mango Women High-Waist Trousers', price: 59, rating: 4.1 },
        { name: 'Uniqlo Women AIRism Cotton Crew Neck T-Shirt', price: 15, rating: 4.4 },
        { name: 'Shein Women Satin Slip Dress', price: 19, rating: 3.9 },
        { name: 'Nike Women Swoosh Sports Bra', price: 45, rating: 4.3 },
        { name: 'Adidas Women Techfit Racer Bra', price: 49, rating: 4.2 },
        { name: 'Forever 21 Women Ribbed Knit Top', price: 22, rating: 4.0 },
        { name: 'Gap Women Cozy Knit Cardigan', price: 59, rating: 4.2 },
        { name: 'Calvin Klein Women Stretch Cotton Shirt', price: 69, rating: 4.3 },
        { name: 'Tommy Hilfiger Women V-Neck Sweater', price: 89, rating: 4.2 },
        { name: 'Hollister Women Ultra High-Rise Wide Leg Jeans', price: 59, rating: 4.1 },
      ],
    },
    // Men Clothing — 12 products
    {
      categoryId: CAT.menClothing, categoryName: "Men's Clothing", pixabayQuery: 'men fashion clothing',
      products: [
        { name: 'Nike Men Dri-FIT Legend Tee', price: 28, rating: 4.5 },
        { name: 'Adidas Men Own the Run Shorts', price: 35, rating: 4.3 },
        { name: 'Ralph Lauren Men Custom Fit Oxford Shirt', price: 119, rating: 4.5 },
        { name: "Levi's Men 511 Slim Fit Jeans", price: 59, rating: 4.4 },
        { name: 'Under Armour Men UA Sportstyle Hoodie', price: 54, rating: 4.4 },
        { name: 'The North Face Men Park Triclimate Jacket', price: 300, rating: 4.5 },
        { name: 'Carhartt Men Loose Fit Washed Duck Vest', price: 69, rating: 4.4 },
        { name: 'Columbia Men Steens Mountain Full Zip Fleece', price: 55, rating: 4.4 },
        { name: 'Nautica Men Big & Tall Classic Fit Polo', price: 69, rating: 4.2 },
        { name: 'Puma Men Team Liga Shorts', price: 30, rating: 4.2 },
        { name: 'Champion Men Powerblend Fleece Joggers', price: 40, rating: 4.3 },
        { name: 'Dickies Men Short Sleeve Work Shirt', price: 29, rating: 4.3 },
      ],
    },
    // Shoes — 12 products
    {
      categoryId: CAT.shoes, categoryName: 'Shoes', pixabayQuery: 'shoes sneakers',
      products: [
        { name: 'Nike Air Jordan 1 Retro High OG', price: 180, rating: 4.7 },
        { name: 'Nike Dunk Low Retro White Black', price: 110, rating: 4.6 },
        { name: 'Adidas Forum Low White', price: 90, rating: 4.3 },
        { name: 'New Balance 574 Classic', price: 89, rating: 4.5 },
        { name: 'Puma RS-X3 Puzzle', price: 100, rating: 4.2 },
        { name: 'Asics Gel-Kayano 30', price: 160, rating: 4.5 },
        { name: 'Reebok Nano X4 Training Shoe', price: 140, rating: 4.4 },
        { name: 'Hoka Arahi 7 Running Shoe', price: 145, rating: 4.5 },
        { name: 'Saucony Triumph 22', price: 160, rating: 4.5 },
        { name: 'Altra Escalante 4 Running Shoe', price: 150, rating: 4.3 },
        { name: 'On Running Cloudmonster', price: 170, rating: 4.5 },
        { name: 'Salomon Speedcross 6 Trail Running', price: 140, rating: 4.4 },
      ],
    },
    // Bags — 12 products
    {
      categoryId: CAT.bags, categoryName: 'Bags', pixabayQuery: 'fashion handbag purse',
      products: [
        { name: 'Michael Kors Jet Set Travel Tote', price: 298, rating: 4.4 },
        { name: 'Coach Pillow Madison Shoulder Bag', price: 395, rating: 4.3 },
        { name: 'Kate Spade New York Small Lane Shoulder Bag', price: 249, rating: 4.2 },
        { name: 'Tory Burch Lee Radziwill Petite Bag', price: 498, rating: 4.4 },
        { name: 'Longchamp Le Pliage Tote Bag', price: 145, rating: 4.5 },
        { name: 'Fjällräven Kånken Classic Backpack', price: 80, rating: 4.6 },
        { name: 'Herschel Little America Backpack', price: 99, rating: 4.4 },
        { name: 'Kipling Abanu Medium Backpack', price: 79, rating: 4.3 },
        { name: 'Samsonite Omni PC Hardside Carry-On', price: 119, rating: 4.5 },
        { name: 'Tumi Alpha 3 Expandable Brief', price: 695, rating: 4.6 },
        { name: 'Fossil Harper Leather Crossbody Bag', price: 158, rating: 4.2 },
        { name: 'Puma Phase Backpack', price: 40, rating: 4.1 },
      ],
    },
    // Accessories — 12 products
    {
      categoryId: CAT.accessories, categoryName: 'Accessories', pixabayQuery: 'fashion accessories jewelry',
      products: [
        { name: 'Ray-Ban Aviator Sunglasses Classic', price: 163, rating: 4.5 },
        { name: 'Ray-Ban Wayfarer Sunglasses', price: 153, rating: 4.6 },
        { name: 'Oakley Holbrook Sunglasses', price: 123, rating: 4.4 },
        { name: 'Daniel Wellington Classic Watch', price: 199, rating: 4.2 },
        { name: 'Fossil Gen 6 Hybrid Smartwatch', price: 199, rating: 4.1 },
        { name: 'Swatch Sistem 51 Irony', price: 185, rating: 4.2 },
        { name: 'Herschel Wallet RFID-Blocking', price: 29, rating: 4.3 },
        { name: 'Bellroy Slim Sleeve Wallet', price: 79, rating: 4.5 },
        { name: 'SwissGear Travel Scarf', price: 24, rating: 4.1 },
        { name: 'Nixon Time Teller Watch', price: 95, rating: 4.2 },
        { name: 'Bose Frames Tempo Audio Sunglasses', price: 249, rating: 4.0 },
        { name: 'Timberland Leather Belt', price: 45, rating: 4.3 },
      ],
    },
    // === OTHER (60 products) ===
    // Furniture — 15 products
    {
      categoryId: CAT.furniture, categoryName: 'Furniture', pixabayQuery: 'furniture interior design',
      products: [
        { name: 'Floyd The Platform Bed Queen', price: 695, rating: 4.4 },
        { name: 'IKEA KIVIK Loveseat Sofa', price: 549, rating: 4.2 },
        { name: 'West Elm Henry Desk', price: 349, rating: 4.3 },
        { name: 'Article Volma Leather Sofa', price: 2199, rating: 4.4 },
        { name: 'CB2 Rocklin Console Table', price: 299, rating: 4.1 },
        { name: 'Structube Nesting Coffee Table', price: 249, rating: 4.0 },
        { name: 'EQ3 Sideboard Credenza', price: 1299, rating: 4.3 },
        { name: 'Room & Board Metro Bookcase', price: 649, rating: 4.2 },
        { name: 'IKEA HEMNES Daybed', price: 329, rating: 4.3 },
        { name: 'Herman Miller Setu Chair', price: 895, rating: 4.5 },
        { name: 'Steelcase Series 1 Office Chair', price: 599, rating: 4.4 },
        { name: 'Autonomous ErgoChair Pro', price: 449, rating: 4.3 },
        { name: 'Branch Ergonomic Chair', price: 399, rating: 4.2 },
        { name: 'Uplift V2 Standing Desk', price: 599, rating: 4.5 },
        { name: 'Urban Outfitters Odessa Rug', price: 199, rating: 4.1 },
      ],
    },
    // Skincare — 15 products
    {
      categoryId: CAT.skincare, categoryName: 'Skincare', pixabayQuery: 'skincare beauty products',
      products: [
        { name: 'Shiseido Ultimune Power Infusing Concentrate', price: 75, rating: 4.5 },
        { name: 'La Mer Crème de la Mer Moisturizer', price: 190, rating: 4.7 },
        { name: 'Dr. Dennis Gross Skincare Daily Peel', price: 88, rating: 4.4 },
        { name: 'Youth to the People Superfood Cleanser', price: 36, rating: 4.4 },
        { name: 'Glow Recipe Watermelon Glow Niacinamide Dew Drops', price: 35, rating: 4.3 },
        { name: 'Farmacy Green Clean Makeup Meltaway Balm', price: 34, rating: 4.4 },
        { name: 'Laneige Water Sleeping Mask', price: 25, rating: 4.5 },
        { name: 'COSRX Snail Mucin 96% Power Essence', price: 16, rating: 4.5 },
        { name: 'Innisfree Green Tea Seed Hyaluronic Serum', price: 22, rating: 4.3 },
        { name: 'Sunday Riley Good Genes Lactic Acid Treatment', price: 85, rating: 4.5 },
        { name: 'Biossance Squalane + Vitamin C Rose Oil', price: 72, rating: 4.3 },
        { name: 'Ole Henriksen Banana Bright Eye Cream', price: 38, rating: 4.3 },
        { name: 'Summer Fridays Jet Lag Mask', price: 48, rating: 4.4 },
        { name: 'Supergoop! Unseen Sunscreen SPF 40', price: 34, rating: 4.5 },
        { name: 'Alpha-H Liquid Gold with Glycolic Acid', price: 49, rating: 4.4 },
      ],
    },
    // Makeup — 15 products
    {
      categoryId: CAT.makeup, categoryName: 'Makeup', pixabayQuery: 'makeup cosmetics beauty',
      products: [
        { name: 'Fenty Beauty Gloss Bomb Universal Lip Luminizer', price: 19, rating: 4.5 },
        { name: 'Charlotte Tilbury Pillow Talk Lipstick', price: 35, rating: 4.5 },
        { name: 'Tarte Maneater Voluptuous Mascara', price: 24, rating: 4.3 },
        { name: 'Benefit Cosmetics They\'re Real! Magnet Mascara', price: 26, rating: 4.3 },
        { name: 'Hourglass Ambient Lighting Powder', price: 52, rating: 4.6 },
        { name: 'Laura Mercier Translucent Loose Setting Powder', price: 39, rating: 4.6 },
        { name: 'Anastasia Beverly Hills Modern Renaissance Palette', price: 42, rating: 4.6 },
        { name: 'Morphe 35O Nature Glow Palette', price: 24, rating: 4.2 },
        { name: 'NARS Orgasm Blush', price: 30, rating: 4.6 },
        { name: 'Dior Forever Skin Glow Foundation', price: 52, rating: 4.4 },
        { name: 'YSL Touche Éclat Radiant Touch', price: 35, rating: 4.3 },
        { name: 'Pat McGrath Labs Mothership Eyeshadow Palette', price: 128, rating: 4.7 },
        { name: 'KVD Beauty Tattoo Liner', price: 22, rating: 4.4 },
        { name: 'e.l.f. Power Grip Primer', price: 10, rating: 4.3 },
        { name: 'Wet n Wild MegaGlo Highlighting Powder', price: 5, rating: 4.2 },
      ],
    },
    // Fitness — 15 products
    {
      categoryId: CAT.fitness, categoryName: 'Fitness', pixabayQuery: 'fitness gym sports',
      products: [
        { name: 'Nike Metcon 8 Training Shoe', price: 130, rating: 4.4 },
        { name: 'Reebok Nano X3 Training Shoe', price: 135, rating: 4.4 },
        { name: 'Gymshark Critical Power Shorts', price: 35, rating: 4.3 },
        { name: 'Lululemon Swiftly Tech Short Sleeve', price: 68, rating: 4.5 },
        { name: 'Under Armour HeatGear Compression Shorts', price: 28, rating: 4.4 },
        { name: 'Garmin Instinct 2 Solar GPS Watch', price: 399, rating: 4.5 },
        { name: 'COROS Pace 3 GPS Watch', price: 229, rating: 4.5 },
        { name: 'Whoop 4.0 Fitness Tracker', price: 239, rating: 4.2 },
        { name: 'Hyperice Hypervolt 2 Pro Massage Gun', price: 329, rating: 4.5 },
        { name: 'Rogue Fitness Adjustable Bench 3.0', price: 645, rating: 4.7 },
        { name: 'REP Fitness Power Rack PR-4000', price: 499, rating: 4.5 },
        { name: 'BOSU Balance Trainer Pro', price: 149, rating: 4.3 },
        { name: 'Jabra Elite 8 Active Earbuds', price: 199, rating: 4.4 },
        { name: 'Nike Yoga Dri-FIT Mat 6mm', price: 75, rating: 4.3 },
        { name: 'Liforme Original Yoga Mat', price: 149, rating: 4.6 },
      ],
    },
  ];

  console.log(`  ${PRODUCT_GROUPS.length} groups, ${PRODUCT_GROUPS.reduce((s,g) => s + g.products.length, 0)} total products`);

  // 5. Search Pixabay for images per category
  console.log('\n5. Searching Pixabay for images...\n');
  const categoryImages = {};
  for (const group of PRODUCT_GROUPS) {
    process.stdout.write(`  ${group.categoryName.padEnd(22)} searching... `);
    try {
      const res = await pixabaySearch(group.pixabayQuery, 5);
      if (res.totalHits > 0 && res.hits.length > 0) {
        categoryImages[group.categoryId] = res.hits.map(h => h.webformatURL);
        console.log(`found ${res.hits.length} images`);
      } else {
        categoryImages[group.categoryId] = [];
        console.log('no results');
      }
    } catch (e) {
      categoryImages[group.categoryId] = [];
      console.log(`failed: ${e.message}`);
    }
    await sleep(600);
  }

  // 6. Build product payload
  console.log('\n6. Building product payload...');
  const allProducts = [];
  for (const group of PRODUCT_GROUPS) {
    const images = categoryImages[group.categoryId] || [];
    for (let i = 0; i < group.products.length; i++) {
      const p = group.products[i];
      const img = images.length > 0 ? [images[i % images.length]] : [];
      const origPrice = Math.round(p.price * (1.2 + Math.random() * 0.3) * 100) / 100;
      const salesCount = Math.floor(Math.random() * 500) + 10;
      const reviewCount = Math.floor(salesCount * (0.1 + Math.random() * 0.2));
      allProducts.push({
        name: p.name,
        description: `Premium quality ${p.name} — carefully sourced from top brands. Authentic product with warranty.`,
        images: img,
        categoryId: group.categoryId,
        price: p.price,
        originalPrice: origPrice,
        stock: Math.floor(Math.random() * 200) + 30,
        salesCount,
        reviewCount,
        rating: p.rating,
        tags: [group.categoryName.toLowerCase()],
        profitPercentage: 20,
        isRecommended: true,
      });
    }
  }

  console.log(`  Total products: ${allProducts.length}`);
  console.log(`  With images: ${allProducts.filter(p => p.images.length > 0).length}`);

  // 7. Import via admin API
  console.log('\n7. Importing products...');
  const importRes = await postJSON(`${API}/home/admin/bulk-import-products`,
    { products: allProducts }, token
  );
  console.log('Import result:', JSON.stringify(importRes, null, 2));

  if (importRes.code === 0) {
    console.log('\n=== IMPORT COMPLETE ===');
    console.log(`  Created: ${importRes.data?.created || 0}`);
    console.log(`  Failed:  ${importRes.data?.failed || 0}`);
  } else {
    console.error('\nImport failed:', importRes.msg);
  }
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
