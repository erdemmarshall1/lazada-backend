/**
 * import_premium_products.js
 *
 * 1. Deletes ALL existing products
 * 2. Imports premium ($200–$4,999) high-rated products by category
 * 3. Fetches fresh Pixabay images per product
 *
 * Run: node scripts/import_premium_products.js
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

const CATEGORY_KEYWORDS = {
  // Fashion
  'Shoes': ['shoes', 'sneakers', 'boots', 'footwear fashion', 'luxury shoes', 'designer sneakers'],
  'Men Clothing': ['men fashion', 'men clothing', 'men suit', 'men jacket', 'men shirt', 'men style'],
  'Women Clothing': ['women fashion', 'women dress', 'women clothing', 'women jacket', 'women style'],
  'Bags': ['handbag', 'luxury bag', 'designer bag', 'leather bag', 'shoulder bag', 'tote bag'],
  'Accessories': ['watch', 'sunglasses', 'jewelry', 'accessories', 'belt', 'wallet', 'scarf'],
  // Electronics
  'Smartphones': ['smartphone', 'iphone', 'mobile phone', 'samsung phone'],
  'Laptops': ['laptop', 'macbook', 'notebook', 'ultrabook'],
  'Headphones': ['headphones', 'earbuds', 'airpods', 'noise cancelling headphones'],
  'Television': ['tv', 'oled tv', '4k tv', 'smart tv', 'television'],
  'Bluetooth Speakers': ['bluetooth speaker', 'portable speaker', 'wireless speaker'],
  'Speakers': ['bookshelf speaker', 'speaker', 'home audio', 'stereo speaker'],
  'Apple Watch': ['apple watch', 'smartwatch', 'fitness watch'],
  // Home & Living
  'Furniture': ['furniture', 'sofa', 'chair', 'desk', 'table', 'bookshelf', 'bed'],
  // Beauty
  'Skincare': ['skincare', 'facial serum', 'moisturizer', 'face cream', 'sunscreen'],
  'Makeup': ['makeup', 'lipstick', 'foundation', 'palette', 'blush', 'mascara', 'eyeshadow'],
  // Sports
  'Fitness': ['fitness equipment', 'dumbbell', 'yoga mat', 'exercise', 'gym'],
};

const extractKeywords = (name, catId, categories) => {
  const cat = categories.find(c => c._id === catId);
  const catName = cat ? cat.name : '';
  const catKeys = CATEGORY_KEYWORDS[catName] || [];

  const brandWords = ['apple', 'samsung', 'nike', 'adidas', 'sony', 'bose', 'jbl', 'puma', 'levi',
    'gucci', 'zara', 'herman miller', 'steelcase', 'dyson', 'lg', 'sennheiser', 'marshall',
    'bang olufsen', 'bowers wilkins', 'kef', 'bose', 'sonos', 'jbl', 'anker', 'rolex', 'omega',
    'tissot', 'seiko', 'citizen', 'fossil', 'michael kors', 'coach', 'tory burch', 'ralph lauren',
    'tommy hilfiger', 'calvin klein', 'armani', 'versace', 'prada', 'gucci', 'louis vuitton',
    'herschel', 'tumi', 'kipling', 'north face', 'patagonia', 'columbia', 'timberland',
    'dyson', 'vitamix', 'kitchenaid', 'breville', 'de longhi', 'nespresso'];

  const nameLower = name.toLowerCase();
  let keywords = [];
  for (const bw of brandWords) {
    if (nameLower.includes(bw)) { keywords.push(bw); }
  }
  if (keywords.length === 0) {
    const words = name.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    const stopwords = new Set(['the', 'and', 'for', 'with', 'new', '2024', '2025', '2026', 'hot',
      'sale', 'best', 'top', 'high', 'quality', 'premium', 'luxury', 'designer', 'black', 'white',
      'blue', 'red', 'size', 'color', 'leather', 'genuine']);
    keywords = words.filter(w => !stopwords.has(w.toLowerCase())).slice(0, 3);
  }
  const all = [...new Set([...keywords, ...catKeys.slice(0, 2)])];
  return all.join(' ').trim() || catName || 'product';
};

// ---- PRODUCT CATALOG ----

const premiumProducts = (catMap) => {
  const fashionId = catMap['Fashion'];
  const electronicsId = catMap['Electronics'];
  const homeId = catMap['Home & Living'];
  const beautyId = catMap['Beauty'];
  const sportsId = catMap['Sports'];

  const products = [];

  // Helper
  const add = (name, categoryId, price, desc, tags, rating, sales) => {
    products.push({
      name, categoryId, price,
      description: desc || `Premium ${name} — high-quality authentic product. Top-rated with ${rating} stars.`,
      tags: tags || [],
      rating: rating || 4.8,
      salesCount: sales || Math.floor(Math.random() * 5000) + 200,
      reviewCount: Math.floor((rating || 4.8) * 50) + 10,
      originalPrice: Math.round(price * (1 + Math.random() * 0.4)),
      stock: Math.floor(Math.random() * 500) + 50,
    });
  };

  // ======================= FASHION ($200-$4,999) =======================
  const shoesId = catMap['Shoes'];
  const menClothing = catMap['Men Clothing'];
  const womenClothing = catMap['Women Clothing'];
  const bagsId = catMap['Bags'];
  const accessoriesId = catMap['Accessories'];

  // Shoes
  add('Nike Air Jordan 1 Retro High OG', shoesId, 499, 'Iconic AJ1 Retro High — premium leather, timeless style', ['nike','jordan','sneakers'], 4.9);
  add('Adidas Yeezy Boost 350 V2', shoesId, 599, 'Kanye West Yeezy 350 V2 — adidas Primeknit, Boost midsole', ['adidas','yeezy','sneakers'], 4.8);
  add('Gucci Ace Embroidered Sneaker', shoesId, 2499, 'Gucci Ace — white leather, embroidered bee motif', ['gucci','sneakers','luxury'], 4.7);
  add('Balenciaga Triple S Sneaker', shoesId, 3999, 'Balenciaga Triple S — chunky silhouette, mesh & leather', ['balenciaga','sneakers'], 4.6);
  add('Common Projects Achilles Low', shoesId, 799, 'Italian leather, minimalist design — cult favorite', ['common projects','sneakers'], 4.9);
  add('Golden Goose Super-Star Sneaker', shoesId, 1299, 'Distressed leather, star patch — pre-worn aesthetic', ['golden goose','sneakers'], 4.7);
  add('Prada Cloudbust Thunder Sneaker', shoesId, 3299, 'Prada Cloudbust — chunky rubber sole, mesh upper', ['prada','sneakers','luxury'], 4.5);
  add('Valentino Garavani Rockstud Sneaker', shoesId, 2899, 'Valentino Rockstud — leather, signature studs', ['valentino','sneakers'], 4.6);
  add('New Balance 990v6 Made in USA', shoesId, 249, 'Premium suede & mesh, Made in USA', ['new balance','sneakers'], 4.9);
  add('ASICS Gel-Kayano 30 Running Shoe', shoesId, 249, 'Advanced stability, FF BLAST PLUS ECO cushioning', ['asics','running','shoes'], 4.8);
  add('Hoka Bondi 8 Max Cushion', shoesId, 284, 'Maximum cushioning, Meta-Rocker technology', ['hoka','running','shoes'], 4.9);
  add('On Running Cloudmonster', shoesId, 299, 'CloudTec® midsole, speedboard propulsion', ['on running','shoes'], 4.8);
  add('Salomon Speedcross 6 Trail', shoesId, 215, 'Aggressive grip, trail running icon', ['salomon','trail','shoes'], 4.7);
  add('Timberland 6-Inch Premium Boot', shoesId, 345, 'Waterproof leather, iconic yellow boot', ['timberland','boots'], 4.8);
  add('Dr Martens 1460 Smooth Leather Boot', shoesId, 239, 'Classic 8-eye boot, air-cushioned sole', ['dr martens','boots'], 4.7);
  add('Birkenstock Arizona Soft Footbed', shoesId, 215, 'Iconic two-strap sandal, contoured cork-latex bed', ['birkenstock','sandals'], 4.8);

  // Men Clothing
  add('Ralph Lauren Purple Label Suit', menClothing, 3499, 'Wool silk blend, Italian tailoring, 2-button jacket', ['ralph lauren','suit'], 4.9);
  add("Tom Ford O'Connor Wool Suit", menClothing, 4999, 'Tom Ford signature silhouette, Super 150s wool', ['tom ford','suit','luxury'], 4.9);
  add('Brunello Cucinelli Cashmere Blazer', menClothing, 4999, 'Pure cashmere unlined blazer, horn buttons', ['brunello cucinelli','blazer'], 4.8);
  add('Canali Tailored Fit Blazer', menClothing, 2999, 'Italian wool blazer, half-canvas construction', ['canali','blazer'], 4.8);
  add('Zegna Trofeo Wool Trousers', menClothing, 999, 'Italian wool, tailored fit, flat front', ['zegna','trousers'], 4.7);
  add('Hugo Boss Slim Fit Suit', menClothing, 2499, 'Wool stretch fabric, modern slim silhouette', ['hugo boss','suit'], 4.8);
  add('Armani Exchange Leather Jacket', menClothing, 1699, 'Nappa lambskin leather jacket, zip front', ['armani','jacket','leather'], 4.7);
  add('The North Face Nuptse 1996 Retro Jacket', menClothing, 495, '700-fill down, boxy retro silhouette', ['north face','jacket'], 4.9);
  add('Patagonia better Sweater 1/4-Zip', menClothing, 259, 'Polartec fleece, classic quarter-zip', ['patagonia','fleece'], 4.8);
  add('Canada Goose Expedition Parka', menClothing, 2499, 'Arctic Tech fabric, 625-fill Hutterite down', ['canada goose','parka'], 4.9);
  add('Moncler Grenoble Down Jacket', menClothing, 3299, 'Nylon quilted, goose down insulation', ['moncler','jacket'], 4.8);
  add('Carhartt Detroit Jacket', menClothing, 345, 'Sandstone duck fabric, blanket lining', ['carhartt','jacket'], 4.7);
  add('Dickies Original 874 Work Pant', menClothing, 239, '65/35 poly-cotton twill, classic fit', ['dickies','pants'], 4.7);
  add('Levi Vintage Clothing 1955 501 Jean', menClothing, 495, 'Raw selvedge denim, button fly', ['levi','jeans','denim'], 4.8);
  add('Rag & Bone Fit 2 Slim Jean', menClothing, 295, 'Stretch denim, mid-rise slim fit', ['rag bone','jeans'], 4.7);
  add('Acne Studios Max Straight Jean', menClothing, 399, 'Raw denim, straight leg, five-pocket', ['acne studios','jeans'], 4.7);
  add('Saint Laurent Teddy Jacket', menClothing, 4499, 'Wool & mohair blend, classic moto silhouette', ['saint laurent','jacket'], 4.8);
  add('Stone Island Soft Shell Jacket', menClothing, 1899, 'Nylon exterior, windproof membrane', ['stone island','jacket'], 4.7);

  // Women Clothing
  add('Chanel Tweed Jacket', womenClothing, 4999, 'Iconic bouclé tweed, gold-tone buttons, CC logo', ['chanel','jacket','tweed'], 4.9);
  add('Max Mara Teddy Bear Coat', womenClothing, 3999, 'Iconic teddy coat, pure camel hair', ['max mara','coat'], 4.9);
  add('Dior Bar Jacket', womenClothing, 4999, 'New Look silhouette, sculpted wool crepe', ['dior','jacket'], 4.8);
  add('Burberry Trench Coat', womenClothing, 2999, 'Iconic Kensington trench, cotton gabardine', ['burberry','trench','coat'], 4.9);
  add('Gucci GG Marmot Leather Jacket', womenClothing, 3999, 'Nappa leather, GG Marmot flap closure', ['gucci','jacket','leather'], 4.8);
  add('Prada Re-Edition 2005 Re-Nylon Dress', womenClothing, 2499, 'Re-edition silhouette, Re-Nylon fabric', ['prada','dress'], 4.7);
  add('Valentino Miniaudiere Silk Dress', womenClothing, 3499, 'Silk faille, bow detail, midi length', ['valentino','dress','silk'], 4.8);
  add('Zimmermann Silk Mini Dress', womenClothing, 899, 'Printed silk, ruffled hem, romantic style', ['zimmermann','dress'], 4.8);
  add('Self-Portrait Tweed Mini Dress', womenClothing, 599, 'Signature tweed, crystal button front', ['self portrait','dress'], 4.7);
  add('Alo Yoga Airlift Leggings', womenClothing, 275, 'Buttery-soft Airlift fabric, high-waisted', ['alo yoga','leggings'], 4.8);
  add('Lululemon Define Jacket Nulu', womenClothing, 289, 'Nulu fabric, sleek silhouette, thumbholes', ['lululemon','jacket'], 4.9);
  add('The Row Margaux Knit Dress', womenClothing, 3999, 'Ribbed cashmere, minimal silhouette', ['the row','dress','cashmere'], 4.7);
  add('Alexander McQueen Tailored Trousers', womenClothing, 2499, 'Wool crepe, selvedge stripe detail', ['alexander mcqueen','trousers'], 4.7);

  // Bags
  add('Louis Vuitton Neverfull MM', bagsId, 2899, 'Monogram canvas, spacious tote, leather trim', ['louis vuitton','bag','tote'], 4.9);
  add('Hermès Picotin Lock Bag', bagsId, 4999, 'Clèmence calfskin, padlock closure, iconic bucket bag', ['hermes','bag','luxury'], 4.9);
  add('Chanel Classic Flap Bag', bagsId, 4999, 'Quilted lambskin, CC turn-lock, chain strap', ['chanel','bag','flap'], 4.9);
  add('Gucci Jackie 1961 Bag', bagsId, 3599, 'Iconic hobo silhouette, leather & GG Supreme', ['gucci','bag','hobo'], 4.8);
  add('Prada Re-Edition 2005 Nylon Bag', bagsId, 2599, 'Re-Nylon fabric, enamel triangle logo, nylon strap', ['prada','bag','nylon'], 4.8);
  add('Saint Laurent Loulou Small Bag', bagsId, 3499, 'Matelassé leather, YSL monogram, quilted', ['saint laurent','bag'], 4.8);
  add('Dior Lady Dior Medium Bag', bagsId, 4999, 'Cannage stitching, D.I.O.R. charms, lambskin', ['dior','bag','lady'], 4.9);
  add('Bottega Veneta Jodie Small Bag', bagsId, 3999, 'Intrecciato leather, knot detail, hobo silhouette', ['bottega veneta','bag'], 4.8);
  add('Celine Luggage Nano Bag', bagsId, 4350, 'Phantom silhouette, drummed calfskin, winged sides', ['celine','bag'], 4.7);
  add('Loewe Puzzle Small Bag', bagsId, 3999, 'Geometric silhouette, calfskin leather', ['loewe','bag'], 4.8);
  add('Fendi Baguette Medium Bag', bagsId, 3999, 'Iconic rectangular silhouette, FF jacquard', ['fendi','bag','baguette'], 4.8);
  add('Tory Burch Lee Radziwill Petite Bag', bagsId, 1499, 'Saffiano leather, top handle, gold hardware', ['tory burch','bag'], 4.7);
  add('Michael Kors Jet Set Travel Tote', bagsId, 695, 'Saffiano leather, signature hardware, spacious', ['michael kors','bag','tote'], 4.7);
  add('Coach Willow Shoulder Bag', bagsId, 795, 'Glovetanned leather, turn-lock closure', ['coach','bag','shoulder'], 4.7);
  add('Tumi Alpha 3 Expandable Brief', bagsId, 895, 'Ballistic nylon, padded laptop compartment', ['tumi','briefcase'], 4.9);
  add('Herschel Little America Backpack', bagsId, 239, 'Classic mountaineering style, padded 15" laptop sleeve', ['herschel','backpack'], 4.7);

  // Accessories
  add('Omega Speedmaster Professional Moonwatch', accessoriesId, 4999, 'Manual-winding chronograph, hesalite crystal, iconic moonwatch', ['omega','watch','luxury'], 4.9);
  add('Tag Heuer Carrera Calibre 16', accessoriesId, 2899, 'Automatic chronograph, steel case, date display', ['tag heuer','watch'], 4.8);
  add('Rolex Submariner Date 126610LV', accessoriesId, 4999, 'Oystersteel, Cerachrom bezel, maxi case', ['rolex','watch','luxury'], 4.9);
  add('IWC Pilot Mark XX', accessoriesId, 3899, 'Stainless steel, automatic, soft-iron inner case', ['iwc','watch'], 4.8);
  add('Cartier Panthere Small Watch', accessoriesId, 4999, 'Quartz movement, steel & gold, square case', ['cartier','watch','luxury'], 4.8);
  add('Ray-Ban Aviator Classic Sunglasses', accessoriesId, 235, 'Gold frame, green G-15 lens, iconic aviator', ['ray ban','sunglasses'], 4.9);
  add('Maui Jim Peahi Polarized Sunglasses', accessoriesId, 349, 'PolarizedPlus2 lens, lightweight titanium frame', ['maui jim','sunglasses'], 4.8);
  add('Oakley Holbrook Metal Sunglasses', accessoriesId, 279, 'Stainless steel frame, Prizm lens technology', ['oakley','sunglasses'], 4.7);
  add('Montblanc Meisterstrueck Classique Fountain Pen', accessoriesId, 995, 'Precious resin, 14K gold nib, iconic Meisterstueck', ['montblanc','pen'], 4.9);
  add('Tiffany & Co. Paloma Picasso Olive Leaf Earrings', accessoriesId, 2499, 'Sterling silver, olive leaf motif', ['tiffany','earrings','jewelry'], 4.8);
  add('David Yurman Cable Bracelet', accessoriesId, 1599, 'Sterling silver, cable motif, 5mm diameter', ['david yurman','bracelet'], 4.7);

  // ======================= ELECTRONICS ($200-$4,999) =======================
  const phonesId = catMap['Smartphones'];
  const laptopsId = catMap['Laptops'];
  const headphonesId = catMap['Headphones'];
  const tvId = catMap['Television'];
  const btSpeakers = catMap['Bluetooth Speakers'];
  const speakersId = catMap['Speakers'];
  const watchId = catMap['Apple Watch'];

  // Smartphones
  add('Apple iPhone 16 Pro Max 1TB', phonesId, 2599, 'A18 Pro chip, 6.9" OLED, 48MP camera system', ['apple','iphone','smartphone'], 4.9);
  add('Samsung Galaxy S25 Ultra 1TB', phonesId, 2399, 'Snapdragon 8 Gen 4, 200MP camera, S Pen', ['samsung','galaxy','smartphone'], 4.8);
  add('Google Pixel 10 Pro XL 512GB', phonesId, 1499, 'Tensor G5 chip, 50MP camera, AI features', ['google','pixel','smartphone'], 4.8);
  add('OnePlus 13 512GB', phonesId, 999, 'Snapdragon 8 Gen 4, Hasselblad camera, 100W charging', ['oneplus','smartphone'], 4.7);
  add('Sony Xperia 1 VI 512GB', phonesId, 1399, '4K OLED, 48MP triple camera, 3.5mm jack', ['sony','xperia','smartphone'], 4.7);
  add('ASUS ROG Phone 8 Pro 512GB', phonesId, 1199, 'Snapdragon 8 Gen 3, 165Hz AMOLED, AirTrigger 6', ['asus','rog','gaming phone'], 4.7);
  add('Samsung Galaxy Z Fold 6 1TB', phonesId, 2999, '7.6" foldable display, multitasking, S Pen', ['samsung','fold','foldable'], 4.8);

  // Laptops
  add('Apple MacBook Pro 16" M4 Max 2TB', laptopsId, 4999, 'M4 Max chip, 64GB unified memory, 16-core GPU', ['apple','macbook','laptop'], 4.9);
  add('Apple MacBook Pro 14" M4 Pro 1TB', laptopsId, 3499, 'M4 Pro chip, 36GB unified memory, Liquid Retina XDR', ['apple','macbook','laptop'], 4.9);
  add('Apple MacBook Air 15" M4 512GB', laptopsId, 2199, 'M4 chip, 15.3" Liquid Retina, fanless design', ['apple','macbook air','laptop'], 4.8);
  add('Dell XPS 16 Intel Ultra 9 1TB', laptopsId, 2999, 'Intel Core Ultra 9, 16" OLED, RTX 4070', ['dell','xps','laptop'], 4.8);
  add('Microsoft Surface Laptop 7 15" 1TB', laptopsId, 2499, 'Snapdragon X Elite, 15" PixelSense, Copilot+', ['microsoft','surface','laptop'], 4.8);
  add('Lenovo ThinkPad X1 Carbon Gen 12 1TB', laptopsId, 3499, 'Intel Core Ultra 7, 14" OLED, MIL-STD-810H', ['lenovo','thinkpad','laptop'], 4.9);
  add('ASUS ROG Zephyrus G16 RTX 4090 2TB', laptopsId, 3999, 'Intel Core i9, 16" Nebula OLED, 32GB DDR5', ['asus','rog','gaming'], 4.8);
  add('HP Spectre x360 16 2-in-1 1TB', laptopsId, 2599, 'Intel Core Ultra 9, 16" OLED touch, 360° hinge', ['hp','spectre','2-in-1'], 4.7);

  // Headphones
  add('Sony WH-1000XM5 Wireless ANC Headphones', headphonesId, 399, 'Industry-leading ANC, 30hr battery, LDAC', ['sony','headphones','anc'], 4.9);
  add('Bose QuietComfort Ultra Headphones', headphonesId, 429, 'Bose Immersive Audio, CustomTune ANC, 24hr', ['bose','headphones','anc'], 4.9);
  add('Apple AirPods Max 2nd Gen USB-C', headphonesId, 549, 'H2 chip, Adaptive Audio, USB-C, 40hr battery', ['apple','airpods max','headphones'], 4.8);
  add('Sennheiser Momentum 4 Wireless', headphonesId, 499, 'Adaptive ANC, 60hr battery, aptX Adaptive', ['sennheiser','headphones','anc'], 4.8);
  add('Bowers & Wilkins Px8 Headphones', headphonesId, 699, 'Diamond-dome drivers, Nappa leather, ANC', ['bowers wilkins','headphones','luxury'], 4.8);
  add('Focal Bathys Wireless Headphones', headphonesId, 799, 'Mylar dome drivers, ANC, DAC mode, Focal sound', ['focal','headphones','audiophile'], 4.8);
  add('Master & Dynamic MW75 Headphones', headphonesId, 599, 'Ceramic housing, ANC, titanium audio drivers', ['master dynamic','headphones'], 4.7);
  add('Beats Studio Pro Wireless', headphonesId, 349, 'Custom acoustic platform, USB-C lossless, ANC', ['beats','headphones'], 4.7);
  add('Bose QuietComfort Ultra Earbuds', headphonesId, 299, 'Bose Immersive Audio, CustomTune, IPX4', ['bose','earbuds','anc'], 4.8);
  add('Apple AirPods Pro 3rd Gen USB-C', headphonesId, 349, 'H2 chip, Adaptive Audio, USB-C MagSafe', ['apple','airpods','earbuds'], 4.9);
  add('Sony WF-1000XM6 Earbuds', headphonesId, 329, 'Integrated Processor V2, ANC, Hi-Res Audio', ['sony','earbuds','anc'], 4.8);
  add('Samsung Galaxy Buds3 Pro', headphonesId, 249, 'Blade design, 2-way speakers, Adaptive ANC', ['samsung','earbuds'], 4.7);

  // Television
  add('LG G4 OLED evo 77" 4K Smart TV', tvId, 4999, 'OLED evo panel, α11 AI processor, Dolby Vision', ['lg','oled','tv','4k'], 4.9);
  add('Samsung Neo QLED 8K QN900D 85"', tvId, 4999, 'Neo Quantum 8K processor, Infinity One Design', ['samsung','qled','8k','tv'], 4.8);
  add('Sony Bravia XR A95L QD-OLED 65"', tvId, 3499, 'QD-OLED panel, Cognitive Processor XR, XR Triluminos Max', ['sony','bravia','oled','tv'], 4.9);
  add('Sony Bravia X90L 4K Full Array LED 75"', tvId, 2499, 'Full Array LED, Cognitive Processor XR, XR Contrast Booster', ['sony','bravia','led','tv'], 4.8);
  add('LG C4 OLED 65" 4K Smart TV', tvId, 2999, 'OLED evo, α9 AI Gen7, Dolby Atmos, G-SYNC', ['lg','oled','c4','tv'], 4.9);
  add('Hisense U8N Mini-LED 65" 4K TV', tvId, 1999, 'Mini-LED, 2,000 nits peak, Hi-View Engine', ['hisense','miniled','tv'], 4.7);
  add('Samsung Frame QLED 65" 4K TV', tvId, 1999, 'Art Mode, anti-reflection matte display', ['samsung','frame','tv','qled'], 4.8);
  add('Panasonic OLED MZ2000 65"', tvId, 3499, 'Master OLED Pro panel, Dolby Atmos, HCX Pro AI', ['panasonic','oled','tv'], 4.8);

  // Bluetooth Speakers
  add('Sonos Roam 2 Portable Speaker', btSpeakers, 279, 'Portable WiFi + Bluetooth, Trueplay tuning, IP67', ['sonos','roam','speaker'], 4.8);
  add('Bose SoundLink Flex (2nd Gen)', btSpeakers, 299, 'PositionIQ technology, IP67, deep bass', ['bose','soundlink','speaker'], 4.8);
  add('Marshall Emberton III', btSpeakers, 299, 'True Stereophonic sound, 32hr battery, IP67', ['marshall','emberton','speaker'], 4.8);
  add('JBL Charge 5 Bluetooth Speaker', btSpeakers, 279, 'IP67 waterproof, 20hr battery, built-in powerbank', ['jbl','charge','speaker'], 4.8);
  add('Ultimate Ears MEGABOOM 4', btSpeakers, 399, '360° sound, IP67, 20hr battery, adaptive EQ', ['ultimate ears','megaboom','speaker'], 4.7);
  add('Bang & Olufsen Beosound A1 (2nd Gen)', btSpeakers, 349, 'True360 omnidirectional, Alexa, IP67, 18hr', ['bang olufsen','beosound','speaker'], 4.9);
  add('Bose SoundLink Max', btSpeakers, 499, 'Dual passive radiators, 20hr, USB-C charging', ['bose','soundlink','max'], 4.8);
  add('Marshall Middleton', btSpeakers, 399, 'Stackable, IP67, 20hr battery, multi-directional', ['marshall','middleton','speaker'], 4.7);

  // Speakers
  add('Sonos Era 300 Smart Speaker', speakersId, 449, 'Dolby Atmos spatial audio, six drivers, WiFi 6', ['sonos','era','speaker'], 4.8);
  add('Bose Home Speaker 500', speakersId, 499, 'Two custom transducers, Alexa, room calibration', ['bose','home','speaker'], 4.7);
  add('Marshall Stanmore III', speakersId, 399, 'Iconic design, HDMI, RCA, Bluetooth 5.3', ['marshall','stanmore','speaker'], 4.8);
  add('KEF LS50 Wireless II Bookshelf Speakers', speakersId, 2999, 'Uni-Q driver array, 280W, WiFi, HDMI ARC', ['kef','ls50','bookshelf'], 4.9);
  add('Bowers & Wilkins Zeppelin', speakersId, 799, 'Five-driver system, Alexa, aptX Adaptive', ['bowers wilkins','zeppelin','speaker'], 4.8);
  add('Harman Kardon Citation 500', speakersId, 599, '80W output, Google Assistant, 3.5mm aux', ['harman kardon','citation','speaker'], 4.7);
  add('Klipsch RP-600M II Bookshelf Speakers', speakersId, 799, 'Tractrix horn, Cerametallic woofer, 100W', ['klipsch','rp-600m','bookshelf'], 4.8);
  add('Dali Oberon 5 Floorstanding Speakers', speakersId, 1999, 'Wood fibre cone, soft dome tweeter, teak finish', ['dali','oberon','floorstanding'], 4.8);

  // Apple Watch
  add('Apple Watch Ultra 3 49mm Titanium', watchId, 999, 'S10 SiP, precision dual GPS, 36hr battery, titanium', ['apple','ultra','watch'], 4.9);
  add('Apple Watch Series 10 46mm Aluminum', watchId, 599, 'S10 SiP, LTPO3 OLED, sleep apnea, 18hr', ['apple','series 10','watch'], 4.8);
  add('Apple Watch Hermès Series 10 42mm', watchId, 1999, 'Hermès bands, S10 SiP, exclusive faces', ['hermes','apple watch','luxury'], 4.9);
  add('Apple Watch SE (3rd Gen) 44mm', watchId, 299, 'S9 SiP, fall detection, activity tracking', ['apple','se','watch'], 4.7);
  add('Apple Watch Nike Series 10 46mm', watchId, 629, 'Nike sport bands, exclusive faces, S10 SiP', ['nike','apple watch'], 4.8);
  add('Apple Watch Series 9 45mm Stainless Steel', watchId, 799, 'S9 SiP, always-on Retina, stainless steel', ['apple','series 9','watch'], 4.7);

  // ======================= HOME & LIVING ($200-$4,999) =======================
  const furnitureId = catMap['Furniture'];

  add('Herman Miller Aeron Office Chair', furnitureId, 3499, 'Iconic ergonomic chair, 8Z Pellicle suspension, adjustable', ['herman miller','aeron','chair'], 4.9);
  add('Steelcase Gesture Office Chair', furnitureId, 2999, '3D LiveBack technology, CoreFlex FR fabric, adjustable arms', ['steelcase','gesture','chair'], 4.8);
  add('Herman Miller Eames Lounge Chair & Ottoman', furnitureId, 4999, 'Iconic molded plywood, premium leather, die-cast aluminum', ['herman miller','eames','lounge chair'], 4.9);
  add('Steelcase Series 1 Office Chair', furnitureId, 1999, 'Adjustable lumbar, 4D arms, Air LiveBack', ['steelcase','series 1','chair'], 4.7);
  add('Uplift V2 Standing Desk 72"', furnitureId, 1599, 'Dual motor, programmable height, 72"x30" bamboo top', ['uplift','standing desk'], 4.8);
  add('West Elm Henry Desk', furnitureId, 899, 'Solid mango wood, three drawers, brass hardware', ['west elm','desk'], 4.7);
  add('CB2 Acacia Outdoor Dining Table 80"', furnitureId, 2499, 'Solid acacia wood, 80" rectangular, extendable', ['cb2','dining table','outdoor'], 4.7);
  add('IKEA KIVIK Loveseat Sofa', furnitureId, 599, 'Removable covers, chaise section, pockets for storage', ['ikea','kivik','sofa'], 4.7);
  add('Article Sven Charme Tan Sofa', furnitureId, 2999, 'Italian leather, mid-century silhouette, 3-seat', ['article','sven','sofa'], 4.8);
  add('Lovesac Sactional Modular Sectional', furnitureId, 3999, 'Modular design, machine-washable covers, StealthTech', ['lovesac','sactional','sectional'], 4.8);
  add('Crate & Barrel Lounge Chair', furnitureId, 1499, 'Linen upholstery, walnut legs, plush cushion', ['crate barrel','lounge chair'], 4.7);
  add('Pottery Barn Turner Square Coffee Table', furnitureId, 1199, 'Solid acacia wood, square silhouette, lower shelf', ['pottery barn','coffee table'], 4.7);
  add('IKEA MALM Queen Bed Frame', furnitureId, 599, 'Storage drawers, slatted bed base, queen size', ['ikea','malm','bed'], 4.6);
  add('Saatva Classic Mattress Queen', furnitureId, 2399, 'Dual coil-on-coil, organic cotton, 180-day trial', ['saatva','mattress','queen'], 4.9);
  add('Room & Board Metro Bookcase 72"', furnitureId, 1799, 'Solid walnut, adjustable shelves, 72" height', ['room board','bookcase'], 4.8);
  add('IKEA BILLY Bookcase 79"', furnitureId, 329, 'Iconic bookcase, adjustable shelves, birch veneer', ['ikea','billy','bookcase'], 4.7);
  add('Herman Miller Setu Chair', furnitureId, 1799, 'Multi-layer suspension back, adjustable seat, polypropylene', ['herman miller','setu','chair'], 4.7);
  add('Article Volma Leather Sofa', furnitureId, 3999, 'Full-grain aniline leather, 3-seat, steel legs', ['article','volma','sofa','leather'], 4.8);

  // ======================= BEAUTY ($200-$4,995) =======================
  const skincareId = catMap['Skincare'];
  const makeupId = catMap['Makeup'];

  // Skincare
  add('La Mer Crème de la Mer Moisturizer 60ml', skincareId, 895, 'Miracle Broth™, shea butter, lime tea extract', ['la mer','moisturizer','luxury'], 4.9);
  add('SkinCeuticals C E Ferulic Serum 30ml', skincareId, 499, '15% pure vitamin C, 1% vitamin E, 0.5% ferulic acid', ['skinceuticals','serum','vitamin c'], 4.9);
  add('Dr. Barbara Sturm Face Cream 50ml', skincareId, 299, 'Purslane extract, shea butter, vitamin E', ['barbara sturm','face cream'], 4.8);
  add('Augustinus Bader The Rich Cream 50ml', skincareId, 499, 'TFC8® technology, shea butter, squalane', ['augustinus bader','moisturizer'], 4.8);
  add('Tatcha The Dewy Skin Cream 50ml', skincareId, 349, 'Hyaluronic acid, squalane, Okinawa red algae', ['tatcha','dewy','cream'], 4.8);
  add('Estée Lauder Advanced Night Repair Serum 50ml', skincareId, 325, 'Chronolux™ Power Signal, hyaluronic acid, peptide', ['estee lauder','night repair','serum'], 4.9);
  add('La Roche-Posay Anthelios SPF 50 Sunscreen 50ml', skincareId, 239, 'Cell-Ox Shield XL, oil-free, invisible finish', ['la roche posay','sunscreen','spf'], 4.8);
  add('Drunk Elephant C-Firma Fresh Day Serum 30ml', skincareId, 245, '15% vitamin C, ferulic acid, vitamin E', ['drunk elephant','vitamin c','serum'], 4.7);
  add('Sunday Riley Good Genes Lactic Acid 30ml', skincareId, 249, 'Lactic acid, licorice extract, arnica', ['sunday riley','lactic acid','treatment'], 4.8);
  add('Biossance Squalane + Vitamin C Rose Oil 30ml', skincareId, 298, 'Vitamin C, squalane, rose oil — brightening', ['biossance','vitamin c','oil'], 4.7);
  add('Tata Harper Resurfacing Mask 30ml', skincareId, 299, 'BHA + AHA fruit acids, pomegranate enzymes', ['tata harper','mask','resurfacing'], 4.7);
  add('Clé de Peau Beauté The Serum 50ml', skincareId, 499, 'Skin-Empowering Illuminator, platinum golden silk', ['cle de peau','serum','luxury'], 4.8);

  // Makeup
  add('Pat McGrath Labs Mothership VIII Eyeshadow Palette', makeupId, 299, '18 shades, 10 matte, 8 extreme shimmer', ['pat mcgrath','eyeshadow','palette'], 4.9);
  add('Dior Forever Skin Glow Foundation SPF 20', makeupId, 249, '24hr wear, glow finish, SPF 20, 30ml', ['dior','foundation'], 4.8);
  add('Charlotte Tilbury Airbrush Flawless Foundation', makeupId, 295, 'Full coverage, light-diffusing, SPF 20', ['charlotte tilbury','foundation'], 4.8);
  add('Fenty Beauty Pro Filt\'r Soft Matte Foundation', makeupId, 239, '50 shades, soft matte, long wear, 32ml', ['fenty','foundation','beauty'], 4.8);
  add('Chanel Rouge Coco Ultra-Hydrating Lipstick', makeupId, 245, 'Shea butter, rose hip oil, 8hr moisture', ['chanel','lipstick'], 4.7);
  add('Tom Ford Lip Color Matte Lipstick', makeupId, 299, 'Deep-matte finish, vitamin E, 3.5g', ['tom ford','lipstick','luxury'], 4.8);
  add('Hourglass Ambient Lighting Palette', makeupId, 259, 'Three finishing powders, diamond powder technology', ['hourglass','palette'], 4.8);
  add('NARS Orgasm Blush + Laguna Bronzer Duo', makeupId, 249, 'Iconic peachy-pink blush + matte bronzer', ['nars','blush','bronzer'], 4.8);
  add('KVD Beauty Good Apple Foundation Balm', makeupId, 239, 'Full coverage, 36hr, vegan formula', ['kvd','foundation'], 4.7);
  add('Natasha Denona Glam Face Palette', makeupId, 299, '15 shades: 5 face + 10 eyes, high-pigment', ['natasha denona','palette'], 4.8);

  // ======================= SPORTS ($200-$4,999) =======================
  const fitnessId = catMap['Fitness'];

  add('Peloton Bike+', fitnessId, 4999, '24" rotating screen, auto-resistance, Apple GymKit', ['peloton','bike','fitness'], 4.9);
  add('NordicTrack Commercial 2450 Treadmill', fitnessId, 3499, '22" tilt screen, iFit, -3% to 15% incline', ['nordictrack','treadmill'], 4.8);
  add('Rogue Fitness Ohio Bar 20kg', fitnessId, 495, '190K PSI steel, dual knurl marks, 20kg', ['rogue','barbell','fitness'], 4.9);
  add('REP Fitness Power Rack PR-4000', fitnessId, 1299, '1000lb capacity, westside hole spacing, 93" height', ['rep fitness','power rack'], 4.8);
  add('Bowflex SelectTech 552 Adjustable Dumbbells', fitnessId, 599, '5-52.5lbs per hand, dial system, two dumbbells', ['bowflex','dumbbells','adjustable'], 4.8);
  add('Tonal Smart Home Gym', fitnessId, 4999, 'Digital weight up to 200lbs, AI coach, wall-mounted', ['tonal','home gym','smart'], 4.8);
  add('Mirror by Lululemon Home Gym', fitnessId, 2995, 'Interactive fitness mirror, 10,000+ classes', ['mirror','lululemon','home gym'], 4.7);
  add('Hydrow Wave Rowing Machine', fitnessId, 2499, 'Computer-controlled drag, 16" display, 1000+ classes', ['hydrow','rower','fitness'], 4.8);
  add('Theragun Pro 5th Gen Massage Gun', fitnessId, 599, '60lb force, OLED screen, QuietForce Technology', ['theragun','massage','recovery'], 4.9);
  add('Hyperice Hypervolt 2 Pro Massage Gun', fitnessId, 399, '5-speed, QuietGlide, 3-hour battery', ['hyperice','hypervolt','massage'], 4.8);
  add('Garmin Forerunner 965 GPS Running Watch', fitnessId, 599, 'AMOLED display, training readiness, maps', ['garmin','forerunner','running watch'], 4.9);
  add('COROS Pace 3 GPS Watch', fitnessId, 349, 'Dual-frequency GPS, 38hr battery, wrist HR', ['coros','pace 3','watch'], 4.8);
  add('TRX All-in-One Suspension Training System', fitnessId, 349, 'Full-body resistance training, portable, pro-grade', ['trx','suspension','training'], 4.7);
  add('Rogue Monster Bands Set', fitnessId, 295, '4-band set (15-100lb), heavy-duty latex, woven', ['rogue','bands','resistance'], 4.7);
  add('Lululemon Align High-Rise Leggings 28"', fitnessId, 289, 'Nulu fabric, high-rise, weightless feel', ['lululemon','leggings','align'], 4.9);
  add('Manduka PRO Yoga Mat 6mm', fitnessId, 284, 'Closed-cell, 6mm, lifetime warranty, non-toxic', ['manduka','yoga mat','pro'], 4.8);
  add('Gymshark Vital Seamless Leggings', fitnessId, 275, 'Seamless knit, sculpting, squat-proof', ['gymshark','leggings','seamless'], 4.7);

  return products;
};

const main = async () => {
  console.log('='.repeat(60));
  console.log('Premium Product Import ($200–$4,999)');
  console.log('='.repeat(60));

  console.log('\nLogging in as admin...');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, {
    username: USERNAME, password: PASSWORD,
  });
  if (loginRes.code !== 0) {
    console.error('Login failed:', loginRes.msg);
    process.exit(1);
  }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  console.log('\nFetching categories...');
  const catRes = await getJSON(`${API}/home/admin/categories`, token);
  if (catRes.code !== 0) {
    console.error('Failed to fetch categories:', catRes.msg);
    process.exit(1);
  }
  const categories = catRes.data || [];
  const catMap = {};
  for (const c of categories) {
    catMap[c.name] = c._id;
  }
  for (const [name, id] of Object.entries(catMap)) {
    console.log(`  ${name} -> ${id}`);
  }

  console.log('\nFetching existing products (to delete)...');
  const allProducts = [];
  let page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    allProducts.push(...list);
    page++;
    await sleep(200);
  }
  console.log(`  Total existing: ${allProducts.length}`);

  console.log('\nDeleting all existing products...');
  let delOk = 0, delFail = 0;
  for (const p of allProducts) {
    const delRes = await postJSON(`${API}/home/admin/delete-product`, { productId: p._id }, token);
    if (delRes.code === 0) { delOk++; }
    else { delFail++; console.log(`  Delete fail [${p._id}]: ${delRes.msg}`); }
    await sleep(100);
  }
  console.log(`  Deleted: ${delOk}, Failed: ${delFail}`);

  console.log('\nGenerating premium product catalog...');
  const products = premiumProducts(catMap);
  console.log(`  ${products.length} products generated`);

  console.log('\nBulk importing products...');
  const batchSize = 50;
  let totalCreated = 0;
  let totalFailed = 0;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    process.stdout.write(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}... `);
    const importRes = await postJSON(`${API}/home/admin/bulk-import-products`,
      { products: batch }, token
    );
    if (importRes.code === 0) {
      totalCreated += importRes.data?.created || 0;
      totalFailed += importRes.data?.failed || 0;
      process.stdout.write(`Created: ${importRes.data?.created}, Failed: ${importRes.data?.failed}\n`);
    } else {
      process.stdout.write(`FAIL: ${importRes.msg}\n`);
      totalFailed += batch.length;
    }
    await sleep(500);
  }

  console.log(`\nImport complete: ${totalCreated} created, ${totalFailed} failed`);

  // ---- FRESH PIXABAY IMAGES ----
  console.log('\n' + '='.repeat(60));
  console.log('Fetching fresh Pixabay images...');
  console.log('='.repeat(60));

  // Re-fetch imported products
  console.log('\nFetching imported products...');
  const all2 = [];
  page = 1;
  while (true) {
    const res = await getJSON(`${API}/main/goods/getSearchList?pageSize=100&page=${page}`, token);
    const list = res.data?.list || [];
    if (list.length === 0) break;
    all2.push(...list);
    page++;
    await sleep(200);
  }
  console.log(`  Total: ${all2.length}`);

  const usedUrls = new Set();
  const imageUpdates = [];
  let imgOk = 0, imgFail = 0;

  for (let i = 0; i < all2.length; i++) {
    const p = all2[i];
    const name = p.name || '';
    const id = p._id;
    process.stdout.write(`[${i + 1}/${all2.length}] "${name.slice(0, 45)}..." -> `);

    const keywords = extractKeywords(name, p.categoryId, categories);
    if (!keywords) {
      process.stdout.write('SKIP (no keywords)\n');
      continue;
    }

    let foundUrl = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const pbRes = await pixabaySearch(keywords, 3);
        if (pbRes.totalHits > 0 && pbRes.hits.length > 0) {
          for (const hit of pbRes.hits) {
            if (!usedUrls.has(hit.webformatURL)) {
              foundUrl = hit.webformatURL;
              usedUrls.add(foundUrl);
              break;
            }
          }
          if (foundUrl) break;
        }
      } catch (e) { /* retry */ }
      await sleep(200);
    }

    if (!foundUrl) {
      process.stdout.write('FAIL\n');
      imgFail++;
    } else {
      process.stdout.write('OK\n');
      imageUpdates.push({ productId: id, images: [foundUrl] });
      imgOk++;
    }
    await sleep(500);
  }

  console.log(`\nImage search complete: ${imgOk} OK, ${imgFail} FAIL`);

  if (imageUpdates.length > 0) {
    console.log(`\nApplying ${imageUpdates.length} image updates in batches of 50...`);
    for (let i = 0; i < imageUpdates.length; i += 50) {
      const batch = imageUpdates.slice(i, i + 50);
      process.stdout.write(`  Batch ${Math.floor(i / 50) + 1}/${Math.ceil(imageUpdates.length / 50)}... `);
      const upRes = await postJSON(`${API}/home/admin/batch-update-images`,
        { updates: batch }, token
      );
      if (upRes.code === 0) {
        process.stdout.write(`OK (${upRes.data?.ok || 0})\n`);
      } else {
        process.stdout.write(`FAIL: ${upRes.msg}\n`);
      }
      await sleep(300);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('IMPORT COMPLETE');
  console.log(`  Products created: ${totalCreated}`);
  console.log(`  Images assigned:  ${imgOk}`);
  console.log(`  Images failed:    ${imgFail}`);
  console.log(`${'='.repeat(60)}`);
};

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
