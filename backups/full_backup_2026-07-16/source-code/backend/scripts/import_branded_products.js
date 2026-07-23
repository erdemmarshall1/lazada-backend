/**
 * import_branded_products.js
 *
 * Generates 200 branded products across 10 sub-categories,
 * fetches Pixabay images per category, and imports via admin API.
 */
const https = require('https');

const API = 'https://the-outnet-backend-production-3b57.up.railway.app';
const PIXABAY_KEY = '56424266-3980f360793db6c0a5beba10e';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

// Known category IDs from live Railway
const CATEGORIES = {
  womenClothing: '6a38e589847311abe2124e6d',
  menClothing: '6a38e589847311abe2124e6c',
  shoes: '6a38e589847311abe2124e6e',
  smartphones: '6a38e589847311abe2124e6f',
  laptops: '6a38e589847311abe2124e70',
  headphones: '6a38e589847311abe2124e71',
  furniture: '6a38e589847311abe2124e72',
  skincare: '6a38e589847311abe2124e73',
  makeup: '6a38e589847311abe2124e74',
  fitness: '6a38e589847311abe2124e75',
};

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

// ---- Branded product definitions ----
const PRODUCT_GROUPS = [
  {
    categoryId: CATEGORIES.smartphones,
    categoryName: 'Smartphones',
    pixabayQuery: 'smartphone technology',
    products: [
      { name: 'Apple iPhone 16 Pro Max 256GB', price: 1199, rating: 4.8 },
      { name: 'Apple iPhone 16 Pro 128GB', price: 999, rating: 4.7 },
      { name: 'Apple iPhone 16 128GB', price: 799, rating: 4.6 },
      { name: 'Samsung Galaxy S25 Ultra 512GB', price: 1299, rating: 4.7 },
      { name: 'Samsung Galaxy S25+ 256GB', price: 999, rating: 4.6 },
      { name: 'Samsung Galaxy S25 128GB', price: 799, rating: 4.5 },
      { name: 'Google Pixel 9 Pro XL 256GB', price: 1099, rating: 4.6 },
      { name: 'Google Pixel 9 128GB', price: 799, rating: 4.5 },
      { name: 'OnePlus 13 256GB', price: 899, rating: 4.5 },
      { name: 'Xiaomi 14 Pro 256GB', price: 699, rating: 4.4 },
      { name: 'Samsung Galaxy Z Fold 6 512GB', price: 1899, rating: 4.3 },
      { name: 'Samsung Galaxy Z Flip 6 256GB', price: 1099, rating: 4.4 },
      { name: 'Motorola Edge 50 Pro 256GB', price: 599, rating: 4.3 },
      { name: 'Nothing Phone 3 256GB', price: 649, rating: 4.2 },
      { name: 'ASUS ROG Phone 8 Pro 512GB', price: 1199, rating: 4.5 },
      { name: 'Sony Xperia 1 VI 256GB', price: 1099, rating: 4.2 },
      { name: 'Oppo Find X8 Pro 256GB', price: 799, rating: 4.3 },
      { name: 'HONOR Magic7 Pro 256GB', price: 749, rating: 4.3 },
      { name: 'Realme GT 7 Pro 256GB', price: 549, rating: 4.2 },
      { name: 'Tecno Phantom X3 Pro 256GB', price: 499, rating: 4.1 },
    ],
  },
  {
    categoryId: CATEGORIES.laptops,
    categoryName: 'Laptops',
    pixabayQuery: 'laptop computer',
    products: [
      { name: 'Apple MacBook Pro 16" M4 Max 1TB', price: 2499, rating: 4.8 },
      { name: 'Apple MacBook Pro 14" M4 Pro 512GB', price: 1799, rating: 4.7 },
      { name: 'Apple MacBook Air 15" M4 256GB', price: 1299, rating: 4.7 },
      { name: 'Dell XPS 16 Intel Ultra 9 1TB', price: 2199, rating: 4.5 },
      { name: 'Dell XPS 14 Intel Ultra 7 512GB', price: 1599, rating: 4.4 },
      { name: 'HP Spectre x360 16 2-in-1 1TB', price: 1699, rating: 4.4 },
      { name: 'HP Envy 16 Intel i9 1TB', price: 1399, rating: 4.3 },
      { name: 'Lenovo ThinkPad X1 Carbon Gen 12 1TB', price: 1899, rating: 4.6 },
      { name: 'Lenovo Yoga 9i 2-in-1 14" 1TB', price: 1499, rating: 4.4 },
      { name: 'ASUS ROG Zephyrus G16 RTX 4070 1TB', price: 1999, rating: 4.6 },
      { name: 'Acer Predator Helios 16 RTX 4080 1TB', price: 2199, rating: 4.5 },
      { name: 'Microsoft Surface Laptop 7 15" 512GB', price: 1499, rating: 4.4 },
      { name: 'Razer Blade 16 RTX 4080 1TB', price: 2699, rating: 4.3 },
      { name: 'Samsung Galaxy Book4 Ultra 1TB', price: 2199, rating: 4.4 },
      { name: 'LG Gram 17 Intel i7 512GB', price: 1599, rating: 4.2 },
      { name: 'MSI Stealth 16 RTX 4070 1TB', price: 1899, rating: 4.3 },
      { name: 'HUAWEI MateBook X Pro 1TB', price: 1699, rating: 4.4 },
      { name: 'ASUS ZenBook 14 OLED 512GB', price: 999, rating: 4.5 },
      { name: 'Dell Inspiron 16 Plus i7 512GB', price: 1099, rating: 4.2 },
      { name: 'Acer Swift Go 14 OLED 512GB', price: 899, rating: 4.3 },
    ],
  },
  {
    categoryId: CATEGORIES.headphones,
    categoryName: 'Headphones',
    pixabayQuery: 'headphones audio',
    products: [
      { name: 'Sony WH-1000XM6 Wireless Noise Cancelling', price: 399, rating: 4.8 },
      { name: 'Sony WF-1000XM6 Earbuds', price: 299, rating: 4.7 },
      { name: 'Bose QuietComfort Ultra Headphones', price: 429, rating: 4.7 },
      { name: 'Bose QuietComfort Ultra Earbuds', price: 299, rating: 4.6 },
      { name: 'Apple AirPods Pro 3rd Gen USB-C', price: 249, rating: 4.7 },
      { name: 'Apple AirPods Max 2nd Gen', price: 549, rating: 4.5 },
      { name: 'Sennheiser Momentum 4 Wireless', price: 349, rating: 4.6 },
      { name: 'JBL Tour One M2', price: 299, rating: 4.3 },
      { name: 'Beats Studio Pro Wireless', price: 349, rating: 4.4 },
      { name: 'Beats Fit Pro Earbuds', price: 199, rating: 4.4 },
      { name: 'Audio-Technica ATH-M50xBT2', price: 199, rating: 4.6 },
      { name: 'Samsung Galaxy Buds3 Pro', price: 249, rating: 4.5 },
      { name: 'Anker Soundcore Space Q45', price: 149, rating: 4.5 },
      { name: 'Marshall Major V', price: 149, rating: 4.3 },
      { name: 'Skullcandy Crusher Evo', price: 199, rating: 4.2 },
      { name: 'Shure AONIC 50 Gen 2', price: 349, rating: 4.4 },
      { name: 'Jabra Elite 10 Gen 2', price: 249, rating: 4.3 },
      { name: 'Bang & Olufsen Beoplay HX', price: 499, rating: 4.5 },
      { name: 'Beyerdynamic DT 900 Pro X', price: 299, rating: 4.6 },
      { name: 'AKG K371-BT Closed-Back', price: 179, rating: 4.4 },
    ],
  },
  {
    categoryId: CATEGORIES.womenClothing,
    categoryName: "Women's Clothing",
    pixabayQuery: 'women fashion clothing',
    products: [
      { name: 'Zara Women Tailored Blazer', price: 89, rating: 4.3 },
      { name: 'H&M Women Cashmere Blend Sweater', price: 59, rating: 4.2 },
      { name: 'Shein Women Bodycon Midi Dress', price: 24, rating: 4.0 },
      { name: 'Nike Dri-FIT One Luxe Women Leggings', price: 75, rating: 4.4 },
      { name: 'Adidas Originals Women Superstar Track Jacket', price: 85, rating: 4.3 },
      { name: 'Forever 21 Women Denim Jacket', price: 44, rating: 4.1 },
      { name: 'Mango Women Wool Coat', price: 129, rating: 4.3 },
      { name: 'Uniqlo Women Ultra Light Down Jacket', price: 79, rating: 4.5 },
      { name: 'Gap Women Logo Hoodie', price: 49, rating: 4.2 },
      { name: 'Calvin Klein Women Modern Cotton Bralette', price: 45, rating: 4.3 },
      { name: 'Tommy Hilfiger Women Classic Polo Shirt', price: 79, rating: 4.3 },
      { name: "Levi's Women 721 High Rise Skinny Jeans", price: 69, rating: 4.4 },
      { name: 'American Eagle Women Soft & Sexy V-Neck', price: 35, rating: 4.2 },
      { name: 'Victoria Secret Women Pajama Set', price: 65, rating: 4.1 },
      { name: 'Urban Outfitters Women Corduroy Pants', price: 59, rating: 4.0 },
      { name: 'Free People Women Maxi Dress', price: 98, rating: 4.2 },
      { name: 'ASOS Design Women Wrap Midi Dress', price: 55, rating: 4.1 },
      { name: "Levi's Women Trucker Jacket", price: 79, rating: 4.4 },
      { name: 'Uniqlo Women Airism Seamless Tank Top', price: 19, rating: 4.3 },
      { name: 'Calvin Klein Women Wool Peacoat', price: 199, rating: 4.4 },
    ],
  },
  {
    categoryId: CATEGORIES.menClothing,
    categoryName: "Men's Clothing",
    pixabayQuery: 'men fashion clothing',
    products: [
      { name: 'Nike Men Dri-FIT ADV Run Division Shorts', price: 55, rating: 4.4 },
      { name: 'Adidas Men Essentials Fleece Hoodie', price: 65, rating: 4.3 },
      { name: "Ralph Lauren Men Classic Fit Polo", price: 99, rating: 4.5 },
      { name: "Levi's Men 501 Original Fit Jeans", price: 69, rating: 4.5 },
      { name: 'Tommy Hilfiger Men Oxford Shirt', price: 89, rating: 4.3 },
      { name: 'Calvin Klein Men Cotton Boxer Briefs (3-Pack)', price: 35, rating: 4.4 },
      { name: 'Under Armour Men Tech 2.0 Short Sleeve Tee', price: 25, rating: 4.5 },
      { name: 'The North Face Men 1996 Retro Nuptse Jacket', price: 225, rating: 4.6 },
      { name: 'Carhartt Men Rugged Flex Relaxed Fit Jeans', price: 59, rating: 4.4 },
      { name: 'Columbia Men Bugaboo II Fleece Interchange Jacket', price: 110, rating: 4.4 },
      { name: 'Dockers Men Alpha Khaki Slim Fit Pants', price: 59, rating: 4.3 },
      { name: 'Hugo Boss Men Regular Fit Suit', price: 495, rating: 4.5 },
      { name: 'Lacoste Men Slim Fit Pique Polo', price: 85, rating: 4.3 },
      { name: 'Nautica Men Voyage Nylon Puffer Jacket', price: 148, rating: 4.2 },
      { name: 'Puma Men Essentials Logo Hoodie', price: 55, rating: 4.2 },
      { name: 'Patagonia Men Better Sweater 1/4-Zip Fleece', price: 139, rating: 4.6 },
      { name: 'Timberland Men 6-Inch Premium Waterproof Boot', price: 210, rating: 4.6 },
      { name: 'Champion Men Reverse Weave Hoodie', price: 70, rating: 4.4 },
      { name: 'Dickies Men Original 874 Work Pant', price: 44, rating: 4.4 },
      { name: 'The North Face Men Thermoball Eco Insulated Jacket', price: 165, rating: 4.5 },
    ],
  },
  {
    categoryId: CATEGORIES.shoes,
    categoryName: 'Shoes',
    pixabayQuery: 'shoes sneakers',
    products: [
      { name: 'Nike Air Force 1 Low White', price: 110, rating: 4.7 },
      { name: 'Nike Air Max 270 React', price: 160, rating: 4.5 },
      { name: 'Adidas Ultraboost Light Running Shoe', price: 190, rating: 4.6 },
      { name: 'Adidas Stan Smith White', price: 85, rating: 4.4 },
      { name: 'New Balance 990v6 Made in US', price: 199, rating: 4.6 },
      { name: 'Puma Suede Classic XXI', price: 70, rating: 4.3 },
      { name: 'Reebok Club C 85 Vintage', price: 75, rating: 4.3 },
      { name: 'Converse Chuck Taylor All Star Low Top', price: 60, rating: 4.5 },
      { name: 'Vans Old Skool Classic Skate Shoe', price: 65, rating: 4.5 },
      { name: 'Under Armour HOVR Phantom 3 Running', price: 150, rating: 4.3 },
      { name: 'ASICS Gel-Nimbus 26 Running Shoe', price: 160, rating: 4.5 },
      { name: 'Skechers Go Walk 5 Slip-On', price: 75, rating: 4.4 },
      { name: 'Timberland 6-Inch Premium Boot Wheat', price: 210, rating: 4.6 },
      { name: 'Dr Martens 1460 Smooth Leather Boot', price: 150, rating: 4.5 },
      { name: 'Crocs Classic Clog', price: 50, rating: 4.3 },
      { name: 'Clarks Originals Desert Boot', price: 120, rating: 4.4 },
      { name: 'Birkenstock Arizona Soft Footbed Sandal', price: 100, rating: 4.5 },
      { name: 'Merrell Moab 3 Mid Hiking Boot', price: 135, rating: 4.5 },
      { name: 'Hoka Clifton 9 Running Shoe', price: 145, rating: 4.6 },
      { name: 'Brooks Ghost 15 Running Shoe', price: 140, rating: 4.6 },
    ],
  },
  {
    categoryId: CATEGORIES.furniture,
    categoryName: 'Furniture',
    pixabayQuery: 'furniture interior design',
    products: [
      { name: 'IKEA KALLAX Shelf Unit', price: 89, rating: 4.4 },
      { name: 'IKEA MALM Queen Bed Frame', price: 399, rating: 4.3 },
      { name: 'Herman Miller Aeron Office Chair', price: 1395, rating: 4.7 },
      { name: 'Steelcase Gesture Office Chair', price: 1195, rating: 4.6 },
      { name: 'West Elm Mid-Century Dining Table', price: 899, rating: 4.4 },
      { name: 'Crate & Barrel Modern Sofa', price: 1499, rating: 4.3 },
      { name: 'Article Sven Charme Tan Sofa', price: 1799, rating: 4.4 },
      { name: 'Pottery Barn Turner Square Coffee Table', price: 399, rating: 4.2 },
      { name: 'CB2 Acacia Outdoor Dining Table', price: 699, rating: 4.2 },
      { name: 'Joybird Eliot 2-Seat Sofa', price: 1499, rating: 4.3 },
      { name: 'Burrow Nomad Sofa', price: 1295, rating: 4.2 },
      { name: 'Interior Define Maxwell Sofa', price: 1699, rating: 4.3 },
      { name: 'AllModern Accent Armchair', price: 349, rating: 4.1 },
      { name: 'Lovesac Sactional Modular Sectional', price: 2395, rating: 4.5 },
      { name: 'IKEA BILLY Bookcase', price: 89, rating: 4.5 },
      { name: 'West Elm Industrial Pipe Desk', price: 499, rating: 4.2 },
      { name: 'Crate & Barrel Lounge Chair', price: 799, rating: 4.3 },
      { name: 'Herman Miller Eames Lounge Chair', price: 5495, rating: 4.8 },
      { name: 'IKEA POÄNG Rocking Chair', price: 179, rating: 4.4 },
      { name: 'Saatva Classic Mattress Queen', price: 1395, rating: 4.6 },
    ],
  },
  {
    categoryId: CATEGORIES.skincare,
    categoryName: 'Skincare',
    pixabayQuery: 'skincare beauty products',
    products: [
      { name: 'CeraVe Hydrating Facial Cleanser 12oz', price: 17, rating: 4.6 },
      { name: 'CeraVe Moisturizing Cream 16oz', price: 18, rating: 4.7 },
      { name: 'Neutrogena Hydro Boost Water Gel', price: 25, rating: 4.4 },
      { name: "L'Oréal Revitalift Triple Power Day Cream", price: 29, rating: 4.3 },
      { name: 'La Roche-Posay Anthelios SPF 50 Sunscreen', price: 38, rating: 4.5 },
      { name: 'The Ordinary Hyaluronic Acid 2% + B5', price: 10, rating: 4.4 },
      { name: 'The Ordinary Niacinamide 10% + Zinc 1%', price: 6, rating: 4.5 },
      { name: 'Olay Regenerist Micro-Sculpting Cream', price: 28, rating: 4.4 },
      { name: 'Cetaphil Gentle Skin Cleanser 16oz', price: 15, rating: 4.6 },
      { name: "Kiehl's Ultra Facial Cream", price: 35, rating: 4.4 },
      { name: 'Clinique Dramatically Different Moisturizing Gel', price: 30, rating: 4.3 },
      { name: "Estée Lauder Advanced Night Repair Serum", price: 79, rating: 4.6 },
      { name: 'Drunk Elephant C-Firma Fresh Day Serum', price: 68, rating: 4.4 },
      { name: 'SkinCeuticals C E Ferulic Serum', price: 169, rating: 4.7 },
      { name: 'Tatcha The Water Cream', price: 68, rating: 4.4 },
      { name: 'Fresh Rose Deep Hydration Face Cream', price: 45, rating: 4.3 },
      { name: 'Dermalogica Daily Microfoliant', price: 59, rating: 4.5 },
      { name: 'Aveeno Positively Radiant Daily Moisturizer SPF 30', price: 18, rating: 4.3 },
      { name: 'Bioderma Sensibio H2O Micellar Water', price: 15, rating: 4.5 },
      { name: "Paula's Choice 2% BHA Liquid Exfoliant", price: 33, rating: 4.5 },
    ],
  },
  {
    categoryId: CATEGORIES.makeup,
    categoryName: 'Makeup',
    pixabayQuery: 'makeup cosmetics beauty',
    products: [
      { name: 'MAC Studio Fix Fluid Foundation SPF 15', price: 42, rating: 4.4 },
      { name: 'NYX Professional Makeup Lip Lingerie XXL', price: 9, rating: 4.1 },
      { name: 'Maybelline Fit Me Matte + Poreless Foundation', price: 8, rating: 4.3 },
      { name: "Estée Lauder Double Wear Stay-in-Place Foundation", price: 48, rating: 4.6 },
      { name: 'Charlotte Tilbury Airbrush Flawless Foundation', price: 48, rating: 4.5 },
      { name: 'Fenty Beauty Pro Filt\'r Soft Matte Foundation', price: 38, rating: 4.4 },
      { name: 'Too Faced Better Than Sex Mascara', price: 27, rating: 4.3 },
      { name: 'Tarte Shape Tape Concealer', price: 29, rating: 4.5 },
      { name: 'Huda Beauty Easy Bake Loose Powder', price: 34, rating: 4.4 },
      { name: 'Anastasia Beverly Hills Dipbrow Pomade', price: 21, rating: 4.5 },
      { name: 'Urban Decay Naked 3 Eyeshadow Palette', price: 49, rating: 4.4 },
      { name: 'NARS Radiant Creamy Concealer', price: 31, rating: 4.5 },
      { name: 'Dior Addict Lip Glow Oil', price: 37, rating: 4.3 },
      { name: 'Chanel Rouge Coco Lipstick', price: 40, rating: 4.4 },
      { name: 'Rare Beauty Soft Pinch Liquid Blush', price: 23, rating: 4.5 },
      { name: 'e.l.f. Cosmetics Halo Glow Setting Powder', price: 8, rating: 4.2 },
      { name: 'Glossier Boy Brow', price: 16, rating: 4.3 },
      { name: 'Ilia Super Serum Skin Tint SPF 40', price: 48, rating: 4.3 },
      { name: 'Kosas Revealer Foundation SPF 25', price: 42, rating: 4.2 },
      { name: 'Il Makiage Woke Up Like This Foundation', price: 44, rating: 4.3 },
    ],
  },
  {
    categoryId: CATEGORIES.fitness,
    categoryName: 'Fitness',
    pixabayQuery: 'fitness gym sports',
    products: [
      { name: 'Nike Metcon 9 Training Shoes', price: 140, rating: 4.5 },
      { name: 'Adidas Adizero Adios Pro 3 Running Shoe', price: 200, rating: 4.4 },
      { name: 'Under Armour Project Rock 6 Training Shoe', price: 150, rating: 4.3 },
      { name: 'Gymshark Vital Seamless Leggings', price: 55, rating: 4.4 },
      { name: 'Lululemon Align High-Rise Leggings', price: 98, rating: 4.7 },
      { name: 'Lululemon Metal Vent Tech Short Sleeve', price: 68, rating: 4.5 },
      { name: 'Fitbit Charge 6 Fitness Tracker', price: 159, rating: 4.3 },
      { name: 'Garmin Forerunner 265 GPS Running Watch', price: 449, rating: 4.6 },
      { name: 'Garmin Venu 3 GPS Smartwatch', price: 399, rating: 4.5 },
      { name: 'Theragun Pro 5th Gen Massage Gun', price: 449, rating: 4.6 },
      { name: 'TRX All-in-One Suspension Training System', price: 199, rating: 4.5 },
      { name: 'Rogue Fitness Ohio Bar 20kg', price: 295, rating: 4.7 },
      { name: 'Bowflex SelectTech 552 Adjustable Dumbbells', price: 399, rating: 4.5 },
      { name: 'Peloton Bike+', price: 2495, rating: 4.5 },
      { name: 'NordicTrack Commercial 1750 Treadmill', price: 1799, rating: 4.3 },
      { name: 'Manduka PRO Yoga Mat 6mm', price: 120, rating: 4.6 },
      { name: 'Gaiam Essentials Thick Yoga Mat', price: 21, rating: 4.4 },
      { name: 'Hydro Flask Standard Mouth 24oz', price: 38, rating: 4.6 },
      { name: 'Yeti Rambler 26oz Bottle', price: 40, rating: 4.6 },
      { name: 'CamelBak Eddy+ 25oz Water Bottle', price: 22, rating: 4.4 },
    ],
  },
];

const main = async () => {
  console.log('='.repeat(50));
  console.log('Branded Products Importer');
  console.log('='.repeat(50));

  // 1. Log in as admin
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

  // 2. For each category, search Pixabay once and cache images
  console.log('\nSearching Pixabay for product images by category...\n');
  const categoryImages = {};
  for (const group of PRODUCT_GROUPS) {
    process.stdout.write(`  ${group.categoryName.padEnd(20)} searching... `);
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

  // 3. Build product payload
  const allProducts = [];
  for (const group of PRODUCT_GROUPS) {
    const images = categoryImages[group.categoryId] || [];
    for (let i = 0; i < group.products.length; i++) {
      const p = group.products[i];
      const img = images.length > 0 ? [images[i % images.length]] : [];
      const origPrice = Math.round(p.price * (1.2 + Math.random() * 0.3) * 100) / 100;
      const salesCount = Math.floor(Math.random() * 800) + 20;
      const reviewCount = Math.floor(salesCount * (0.1 + Math.random() * 0.2));
      allProducts.push({
        name: p.name,
        description: `Authentic ${p.name} — top rated product from a leading brand. Shop with confidence.`,
        images: img,
        categoryId: group.categoryId,
        price: p.price,
        originalPrice: origPrice,
        stock: Math.floor(Math.random() * 300) + 50,
        salesCount,
        reviewCount,
        rating: p.rating,
        tags: [group.categoryName.toLowerCase()],
        isHot: i < 5,
        isRecommended: i >= 5 && i < 15,
      });
    }
  }

  console.log(`\nTotal products to import: ${allProducts.length}`);
  console.log(`Products with images: ${allProducts.filter(p => p.images.length > 0).length}`);

  // 4. Import via admin API
  console.log('\nImporting products...');
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
