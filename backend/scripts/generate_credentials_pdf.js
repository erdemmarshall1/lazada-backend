/**
 * generate_credentials_pdf.js
 *
 * Generates a PDF file with all project credentials and login walkthrough.
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', '..', 'The Outnet_Credentials.pdf');

const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream(OUTPUT);
doc.pipe(stream);

const FONT_SIZE = { h1: 22, h2: 16, h3: 13, body: 10, small: 8 };
const COLORS = { primary: '#1a73e8', secondary: '#666', accent: '#e63946', success: '#2ecc71' };
const PAGE_WIDTH = 495; // A4 width - 2*50

const addHeader = (text, level = 'h1') => {
  doc.fontSize(FONT_SIZE[level]).fillColor(level === 'h1' ? COLORS.primary : '#333');
  if (level === 'h1') doc.font('Helvetica-Bold');
  else if (level === 'h2') doc.font('Helvetica-Bold');
  else doc.font('Helvetica-Bold');
  doc.text(text, { underline: level === 'h1' });
  doc.moveDown(0.5);
};

const addBody = (text, color = '#333', size = 'body') => {
  doc.fontSize(FONT_SIZE[size]).fillColor(color).font('Helvetica');
  doc.text(text);
  doc.moveDown(0.3);
};

const addField = (label, value) => {
  doc.fontSize(FONT_SIZE.body).fillColor(COLORS.secondary).font('Helvetica');
  doc.text(`${label}: `, { continued: true });
  doc.fillColor('#333').font('Helvetica-Bold');
  doc.text(value);
  doc.moveDown(0.2);
};

const addDivider = () => {
  doc.moveDown(0.5);
  doc.strokeColor('#e0e0e0').lineWidth(1).moveTo(50, doc.y).lineTo(PAGE_WIDTH + 50, doc.y).stroke();
  doc.moveDown(0.5);
};

// ====== TITLE PAGE ======
doc.fontSize(28).fillColor(COLORS.primary).font('Helvetica-Bold');
doc.text('The Outnet Clone - Shopify Wholesale', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(14).fillColor(COLORS.secondary).font('Helvetica');
doc.text('Project Credentials & Setup Guide', { align: 'center' });
doc.moveDown(1);
doc.fontSize(10).fillColor('#999').text(`Generated: ${new Date().toISOString().split('T')[0]}`, { align: 'center' });
doc.moveDown(2);

addDivider();

// ====== SECTION 1: ADMIN CREDENTIALS ======
addHeader('1. Admin Credentials', 'h2');
addField('Username', 'admin_wholesale');
addField('Password', 'Admin@MQQYYI6G');
addField('Role', 'Admin (full access to all backend endpoints)');
doc.moveDown(0.5);

// ====== SECTION 2: API ENDPOINTS ======
addHeader('2. API Endpoints', 'h2');
addField('Backend URL', 'https://the-outnet-backend-production-3b57.up.railway.app');
addField('Frontend URL', 'https://shopifywholesale.netlify.app');
addField('Admin Login', 'POST /main/sendMsg/login');
addField('Category List', 'GET /main/goodsCategory/getList');
addField('Admin Categories', 'GET /home/admin/categories');
addField('Create Category', 'POST /home/admin/add-category');
addField('Bulk Import', 'POST /home/admin/bulk-import-products');
addField('Search Products', 'GET /main/goods/getSearchList');
addField('Product Detail', 'GET /main/goods/getInfo');
addField('User List', 'GET /home/admin/users');
addField('Shop List', 'GET /home/admin/shops');
addField('Transaction List', 'GET /home/admin/transactions');
addField('Platform Wallet', 'GET /home/admin/platform-wallet');

// ====== SECTION 3: DATABASE ======
addDivider();
addHeader('3. Database', 'h2');
addField('Platform', 'MongoDB (Railway Plugin)');
addField('Local URI (dev)', 'mongodb://localhost:27017/shopify_wholesale');
addBody('The production database is managed by Railway and is not directly accessible from outside.');

// ====== SECTION 4: EXTERNAL SERVICES ======
addDivider();
addHeader('4. External Services', 'h2');
addField('Pixabay API Key', '56424266-3980f360793db6c0a5beba10e');
addField('Deployment (Backend)', 'Railway - the-outnet-backend');
addField('Deployment (Frontend)', 'Netlify - shopifywholesale');
addField('JWT Secret', 'shopify_wholesale_jwt_secret_2026');

// ====== SECTION 5: LOGIN WALKTHROUGH ======
addDivider();
addHeader('5. Login Walkthrough', 'h2');
addBody('Step 1: Open the frontend URL in a web browser.');
addBody('Step 2: Click the "Login" button at the top-right corner.');
addBody('Step 3: Enter credentials:');
doc.fontSize(FONT_SIZE.body).fillColor('#333').font('Helvetica');
doc.text('     Username: admin_wholesale');
doc.text('     Password: Admin@MQQYYI6G');
doc.moveDown(0.3);
addBody('Step 4: Click "Login" — you will be redirected to the home page.');
addBody('Step 5: Access the admin panel by navigating to:');
doc.fontSize(FONT_SIZE.body).fillColor(COLORS.primary).font('Helvetica');
doc.text('     /admin/dashboard');
doc.moveDown(0.3);
addBody('Step 6 (Seller): Navigate to /store/my-store to view seller features.');
addBody('Step 7 (Wholesale): Navigate to /sourcegoods to browse wholesale products.');
addBody('Step 8 (Distribute): Click "Distribute" on any wholesale product to add it to your store with a markup.');

// ====== SECTION 6: CATEGORY STRUCTURE ======
addDivider();
addHeader('6. Category Structure', 'h2');
const catTree = [
  ['Fashion', ['Men Clothing', 'Women Clothing', 'Shoes', 'Bags', 'Accessories']],
  ['Electronics', ['Smartphones', 'Laptops', 'Headphones', 'Television', 'Bluetooth Speakers', 'Speakers', 'Apple Watch']],
  ['Home & Living', ['Furniture']],
  ['Beauty', ['Skincare', 'Makeup']],
  ['Sports', ['Fitness']],
];
for (const [l1, subs] of catTree) {
  doc.fontSize(11).fillColor('#333').font('Helvetica-Bold');
  doc.text(`  ${l1}`);
  for (const sub of subs) {
    doc.fontSize(10).fillColor('#666').font('Helvetica');
    doc.text(`    └─ ${sub}`);
  }
  doc.moveDown(0.2);
}

// ====== SECTION 7: PRODUCT STATISTICS ======
addDivider();
addHeader('7. Product Statistics', 'h2');
addBody('Total products in system: 500 (300 original + 200 new)');
addBody('Distribution: 80 Electronics, 60 Fashion, 60 Home & Living / Beauty / Sports');
addBody('New categories added: Bags, Accessories, Television, Bluetooth Speakers, Speakers, Apple Watch');
addBody('All products include Pixabay images, realistic pricing, and profit margins.');

// ====== SECTION 8: TROUBLESHOOTING ======
addDivider();
addHeader('8. Troubleshooting', 'h2');
addBody('• Image not loading: Run the "replace_all_product_images.js" script to refresh images from Pixabay.');
addBody('• Login issues: Use the "Forgot Password" link on the login page.');
addBody('• Wallet not showing: Navigate to /balance or /account/balance.');
addBody('• Backend offline: Check Railway dashboard at railwy.com/dashboard.');
addBody('• Frontend offline: Trigger a new deploy on Netlify dashboard.');

// Footer
doc.moveDown(2);
doc.fontSize(8).fillColor('#999').font('Helvetica');
doc.text('— End of Document —', { align: 'center' });

doc.end();

stream.on('finish', () => {
  console.log(`PDF generated: ${OUTPUT}`);
  console.log(`File size: ${(fs.statSync(OUTPUT).size / 1024).toFixed(1)} KB`);
});

stream.on('error', (err) => {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
});
