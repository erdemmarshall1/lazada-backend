const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Banner = require('../models/Banner');
const { success, fail, paginate } = require('../utils/response');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission } = require('../config/roles');
const themeController = require('../controllers/themeController');
const privacyController = require('../controllers/privacyController');
const upload = require('../middleware/upload');

// ---- Pending transactions ----
/**
 * @openapi
 * /home/admin/pending-recharges:
 *   get:
 *     tags: [Admin]
 *     summary: Get pending recharge requests
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Pending recharges list
 */
router.get('/pending-recharges', adminAuth, walletController.adminGetPendingRecharges);
router.get('/pending-withdraws', adminAuth, walletController.adminGetPendingWithdraws);
router.post('/approve-transaction', adminAuth, walletController.adminApproveTransaction);
router.post('/reject-transaction', adminAuth, walletController.adminRejectTransaction);

// ---- Users ----
/**
 * @openapi
 * /home/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Get paginated users list
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated users
 */
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Shops ----
router.get('/shops', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps, status } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = {};
    if (status !== undefined && status !== '') query.status = Number(status);
    const [list, total] = await Promise.all([
      Shop.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Shop.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

/**
 * @openapi
 * /home/admin/approve-shop:
 *   post:
 *     tags: [Admin]
 *     summary: Approve a shop application, assign store number
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id: { type: string, description: Shop ID }
 *     responses:
 *       200:
 *         description: Shop approved with store number
 */
router.post('/approve-shop', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const counter = await Counter.findOneAndUpdate(
      { name: 'storeNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const storeNumber = `S${String(counter.seq).padStart(5, '0')}`;
    
    const shop = await Shop.findByIdAndUpdate(req.body.id, { 
      status: 1, 
      storeNumber 
    }, { new: true });
    if (!shop) return res.json(fail('Shop not found'));
    await User.findByIdAndUpdate(shop.userId, { role: 'seller' });
    res.json(success(shop, 'Shop approved'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/reject-shop', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.body.id, { status: 2 }, { new: true });
    if (!shop) return res.json(fail('Shop not found'));
    res.json(success(shop, 'Shop rejected'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Products ----
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Transactions (all) ----
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      Transaction.find().populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Platform wallet ----
/**
 * @openapi
 * /home/admin/platform-wallet:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform wallet balances
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Platform wallet data
 */
router.get('/platform-wallet', adminAuth, async (req, res) => {
  try {
    const PlatformWallet = require('../models/PlatformWallet');
    let pw = await PlatformWallet.findOne();
    if (!pw) pw = await PlatformWallet.create({ balance: 0, totalRevenue: 0 });
    res.json(success(pw));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Platform wallet management (credit / debit / history) ----
router.get('/platform-wallet/history', adminAuth, async (req, res) => {
  try {
    const PlatformTransaction = require('../models/PlatformTransaction');
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      PlatformTransaction.find()
        .populate('performedBy', 'username email')
        .populate('recipientId', 'username email')
        .sort({ createdAt: -1 }).skip(skip).limit(limit),
      PlatformTransaction.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/platform-wallet/credit', adminAuth, async (req, res) => {
  try {
    const PlatformWallet = require('../models/PlatformWallet');
    const PlatformTransaction = require('../models/PlatformTransaction');
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const { userId, amount, title, description } = req.body;
    if (!userId) return res.json(fail('Seller userId is required'));
    const num = Number(amount);
    if (!num || num <= 0) return res.json(fail('Amount must be a positive number'));
    const seller = await User.findById(userId);
    if (!seller) return res.json(fail('Seller not found'));
    let pw = await PlatformWallet.findOne();
    if (!pw) pw = await PlatformWallet.create({ balance: 0, totalRevenue: 0 });
    if (pw.balance < num) return res.json(fail('Insufficient platform balance'));
    let sellerWallet = await Wallet.findOne({ userId });
    if (!sellerWallet) sellerWallet = await Wallet.create({ userId, balance: 0 });
    const pwBalanceBefore = pw.balance;
    const pwEscrowBefore = pw.escrowBalance;
    const sellerBalanceBefore = sellerWallet.balance;
    pw.balance -= num;
    await pw.save();
    sellerWallet.balance += num;
    sellerWallet.totalEarned = (sellerWallet.totalEarned || 0) + num;
    await sellerWallet.save();
    const txTitle = (title || '').trim();
    const txDesc = description || '';
    const combinedDesc = txTitle ? (txDesc ? `${txTitle}: ${txDesc}` : txTitle) : (txDesc || 'Platform credit to seller');
    await PlatformTransaction.create({
      type: 'credit', amount: num, title: txTitle,
      balanceBefore: pwBalanceBefore, balanceAfter: pw.balance,
      escrowBefore: pwEscrowBefore, escrowAfter: pw.escrowBalance,
      description: combinedDesc,
      performedBy: req.user._id, recipientId: userId,
    });
    await Transaction.create({
      userId, type: 'admin', amount: num,
      balanceBefore: sellerBalanceBefore,
      balanceAfter: sellerWallet.balance,
      status: 1,
      description: combinedDesc,
    });
    res.json(success({ platform: pw, seller: sellerWallet }, `Credited $${num} to ${seller.username}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/platform-wallet/debit', adminAuth, async (req, res) => {
  try {
    const PlatformWallet = require('../models/PlatformWallet');
    const PlatformTransaction = require('../models/PlatformTransaction');
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const User = require('../models/User');
    const { userId, amount, title, description } = req.body;
    if (!userId) return res.json(fail('Seller userId is required'));
    const num = Number(amount);
    if (!num || num <= 0) return res.json(fail('Amount must be a positive number'));
    const seller = await User.findById(userId);
    if (!seller) return res.json(fail('Seller not found'));
    let pw = await PlatformWallet.findOne();
    if (!pw) pw = await PlatformWallet.create({ balance: 0, totalRevenue: 0 });
    let sellerWallet = await Wallet.findOne({ userId });
    if (!sellerWallet) return res.json(fail('Seller has no wallet'));
    if (sellerWallet.balance < num) return res.json(fail('Insufficient seller balance'));
    const pwBalanceBefore = pw.balance;
    const pwEscrowBefore = pw.escrowBalance;
    const sellerBalanceBefore = sellerWallet.balance;
    pw.balance += num;
    await pw.save();
    sellerWallet.balance -= num;
    sellerWallet.totalSpent = (sellerWallet.totalSpent || 0) + num;
    await sellerWallet.save();
    const txTitle = (title || '').trim();
    const txDesc = description || '';
    const combinedDesc = txTitle ? (txDesc ? `${txTitle}: ${txDesc}` : txTitle) : (txDesc || 'Platform debit from seller');
    await PlatformTransaction.create({
      type: 'debit', amount: num, title: txTitle,
      balanceBefore: pwBalanceBefore, balanceAfter: pw.balance,
      escrowBefore: pwEscrowBefore, escrowAfter: pw.escrowBalance,
      description: combinedDesc,
      performedBy: req.user._id, recipientId: userId,
    });
    await Transaction.create({
      userId, type: 'admin', amount: -num,
      balanceBefore: sellerBalanceBefore,
      balanceAfter: sellerWallet.balance,
      status: 1,
      description: combinedDesc,
    });
    res.json(success({ platform: pw, seller: sellerWallet }, `Debited $${num} from ${seller.username}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Fix product images (download CDN → local, update DB) ----
router.post('/fix-images', adminAuth, async (req, res) => {
  const https = require('https');
  const http = require('http');
  const fs = require('fs');
  const path = require('path');
  const Product = require('../models/Product');

  const UPLOADS = path.join(__dirname, '..', 'uploads', 'product_images');
  if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });

  const downloadImage = (url, dest) => new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }, (resp) => {
      if (resp.statusCode !== 200) { reject(new Error(`HTTP ${resp.statusCode}`)); return; }
      const ext = path.extname(new URL(url).pathname).split('?')[0].toLowerCase() || '.jpg';
      const fp = `${dest}${['.jpg','.jpeg','.png','.gif','.webp','.svg'].includes(ext) ? ext : '.jpg'}`;
      const file = fs.createWriteStream(fp);
      resp.pipe(file);
      file.on('finish', () => { file.close(); resolve(fp); });
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('timeout')); });
  });

  try {
    const products = await Product.find({});
    let fixed = 0, skipped = 0, failed = 0;

    for (const product of products) {
      const img = product.images?.[0];
      if (!img || img.startsWith('/uploads/') || img.startsWith('/')) { skipped++; continue; }
      try {
        const fp = await downloadImage(img, path.join(UPLOADS, product._id.toString()));
        const localPath = '/uploads/product_images/' + product._id.toString() + path.extname(fp);
        product.images = [localPath];
        await product.save();
        fixed++;
      } catch (err) {
        failed++;
      }
    }

    res.json(success({ total: products.length, fixed, skipped, failed }, 'Image fix complete'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Batch-update product images (from scraper script output) ----
router.post('/batch-update-images', adminAuth, async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.json(fail('updates must be a non-empty array of { productId, images }'));
    }
    let ok = 0, failCount = 0;
    for (const u of updates) {
      if (!u.productId || !Array.isArray(u.images)) { failCount++; continue; }
      const r = await Product.findByIdAndUpdate(
        u.productId,
        { $set: { images: u.images } },
        { new: false }
      );
      if (r) ok++; else failCount++;
    }
    res.json(success({ total: updates.length, ok, fail: failCount }, `Updated ${ok} products`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Set profit percentage on all wholesale products ----
router.post('/set-profit-percentage', adminAuth, async (req, res) => {
  try {
    const { percentage = 20 } = req.body;
    const result = await Product.updateMany(
      { profitPercentage: { $exists: false } },
      { $set: { profitPercentage: Number(percentage) } }
    );
    res.json(success({ modified: result.modifiedCount }, `Profit percentage set to ${percentage}%`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Delete product (admin) ----
router.post('/delete-product', adminAuth, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.json(fail('productId required'));
    const r = await Product.findByIdAndDelete(productId);
    if (!r) return res.json(fail('Product not found'));
    res.json(success(null, 'Product deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Toggle product status (admin bypasses shop ownership check) ----
router.post('/toggle-product-status', adminAuth, async (req, res) => {
  try {
    const { productId, status } = req.body;
    if (!productId || status === undefined) return res.json(fail('productId and status required'));
    const product = await Product.findByIdAndUpdate(productId, { status }, { new: true });
    if (!product) return res.json(fail('Product not found'));
    res.json(success(product, status === 1 ? 'Product activated' : 'Product deactivated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Add product (admin creates wholesale product) ----
router.post('/add-product', adminAuth, async (req, res) => {
  try {
    const { name, description, images, categoryId, shopId, skus } = req.body;
    if (!name) return res.json(fail('Product name is required'));
    if (!categoryId) return res.json(fail('Category is required'));
    let targetShopId = shopId;
    if (!targetShopId) {
      const shop = await Shop.findOne({ status: 1 }).sort({ createdAt: 1 });
      if (!shop) return res.json(fail('No approved shop found. Create a shop first.'));
      targetShopId = shop._id;
    }
    const productSkus = skus && skus.length > 0 ? skus : [{ price: 0, stock: 100, attrs: [] }];
    const prices = productSkus.map(s => s.price);
    const product = await Product.create({
      name,
      description: description || '',
      images: images || [],
      categoryId,
      shopId: targetShopId,
      skus: productSkus,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      originalPrice: Math.max(...prices),
      status: 1,
    });
    await Shop.findByIdAndUpdate(targetShopId, { $inc: { productCount: 1 } });
    res.json(success(product, 'Product created'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Update product (admin bypasses shop ownership check) ----
router.post('/update-product', adminAuth, async (req, res) => {
  try {
    const { id, ...data } = req.body;
    if (!id) return res.json(fail('id required'));
    if (data.skus && data.skus.length > 0) {
      const prices = data.skus.map(s => s.price);
      data.minPrice = Math.min(...prices);
      data.maxPrice = Math.max(...prices);
    }
    const product = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!product) return res.json(fail('Product not found'));
    res.json(success(product, 'Product updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Update banners (admin) ----
router.post('/update-banners', adminAuth, async (req, res) => {
  try {
    const Banner = require('../models/Banner');
    const { banners } = req.body;
    if (!Array.isArray(banners)) return res.json(fail('banners must be an array'));
    let ok = 0, failCount = 0;
    for (const b of banners) {
      if (!b._id) { failCount++; continue; }
      const update = {};
      if (b.image !== undefined) update.image = b.image;
      if (b.title !== undefined) update.title = b.title;
      if (b.link !== undefined) update.link = b.link;
      const r = await Banner.findByIdAndUpdate(b._id, { $set: update }, { new: false });
      if (r) ok++; else failCount++;
    }
    res.json(success({ total: banners.length, ok, fail: failCount }, `Updated ${ok} banners`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Bulk import products (admin) ----
router.post('/bulk-import-products', adminAuth, async (req, res) => {
  try {
    const Shop = require('../models/Shop');
    let { products, shopId } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.json(fail('products must be a non-empty array'));
    }
    if (!shopId) {
      const shop = await Shop.findOne({ status: 1 }).sort({ createdAt: 1 });
      if (!shop) return res.json(fail('No approved shop found. Provide a shopId.'));
      shopId = shop._id;
    }
    let created = 0, failed = 0;
    const batch = [];
    for (const p of products) {
      if (!p.name || !p.categoryId) { failed++; continue; }
      const prices = (p.skus || []).map(s => s.price);
      batch.push({
        name: p.name,
        description: p.description || '',
        images: p.images || [],
        categoryId: p.categoryId,
        shopId,
        skus: p.skus || [{ price: p.price || 0, stock: p.stock || 100, attrs: [] }],
        minPrice: prices.length > 0 ? Math.min(...prices) : (p.price || 0),
        maxPrice: prices.length > 0 ? Math.max(...prices) : (p.price || 0),
        originalPrice: p.originalPrice || 0,
        salesCount: p.salesCount || 0,
        reviewCount: p.reviewCount || 0,
        rating: p.rating || 5,
        tags: p.tags || [],
        status: 1,
        isHot: !!p.isHot,
        isRecommended: !!p.isRecommended,
      });
    }
    if (batch.length > 0) {
      const inserted = await Product.insertMany(batch);
      created = inserted.length;
      await Shop.findByIdAndUpdate(shopId, { $inc: { productCount: created } });
    }
    res.json(success({ total: products.length, created, failed }, `Imported ${created} products`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- User Privacy & Audit (admin) ----
router.get('/users/:id/privacy', adminAuth, privacyController.adminGetUserPrivacy);
router.post('/users/:id/toggle-status', adminAuth, privacyController.adminToggleUserStatus);
router.get('/audit-log', adminAuth, privacyController.adminGetAuditLog);

// ---- Category management ----
const Category = require('../models/Category');

router.get('/categories', adminAuth, async (req, res) => {
  try {
    const list = await Category.find().sort({ sort: 1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/add-electronics-subcategories', adminAuth, async (req, res) => {
  try {
    const Category = require('../models/Category');
    const electronics = await Category.findOne({ name: 'Electronics', level: 1 });
    if (!electronics) return res.json(fail('Electronics category not found'));
    const existing = await Category.find({ parentId: electronics._id });
    const existingNames = existing.map(c => c.name);
    const subCats = ['Speakers', 'Apple Watch', 'Bluetooth Speakers', 'Television']
      .filter(name => !existingNames.includes(name))
      .map((name, i) => ({
        name, parentId: electronics._id, level: 2,
        sort: existing.length + i + 1, status: 1,
      }));
    if (subCats.length > 0) {
      await Category.insertMany(subCats);
      res.json(success(subCats, `Added ${subCats.length} sub-categories under Electronics`));
    } else {
      res.json(success([], 'All sub-categories already exist'));
    }
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/add-category', adminAuth, async (req, res) => {
  try {
    const { name, parentId, level, icon, image, sort } = req.body;
    if (!name) return res.json(fail('Category name is required'));
    const cat = await Category.create({
      name,
      parentId: parentId || null,
      level: level || (parentId ? 2 : 1),
      icon: icon || '',
      image: image || '',
      sort: sort || 0,
      status: 1,
    });
    res.json(success(cat, 'Category created'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Invitation Codes ----
const InvitationCode = require('../models/InvitationCode');

router.get('/invitation-codes', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      InvitationCode.find().populate('usedBy', 'name').populate('createdBy', 'username').sort({ createdAt: -1 }).skip(skip).limit(limit),
      InvitationCode.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/invitation-codes/generate', adminAuth, async (req, res) => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const doc = await InvitationCode.create({ code, createdBy: req.user._id });
    res.json(success(doc, 'Invitation code generated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.patch('/invitation-codes/:id/deactivate', adminAuth, async (req, res) => {
  try {
    const doc = await InvitationCode.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!doc) return res.json(fail('Code not found'));
    res.json(success(doc, 'Code deactivated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Payment Settings ----
const PaymentSetting = require('../models/PaymentSetting');

router.get('/payment-settings', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      PaymentSetting.find().sort({ sort: 1, createdAt: -1 }).skip(skip).limit(limit),
      PaymentSetting.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/payment-settings', adminAuth, async (req, res) => {
  try {
    const { method, label, walletAddress, isActive, sort } = req.body;
    if (!method || !label) return res.json(fail('Method and label are required'));
    const existing = await PaymentSetting.findOne({ method });
    if (existing) return res.json(fail('Payment method already exists'));
    const doc = await PaymentSetting.create({ method, label, walletAddress, isActive, sort });
    res.json(success(doc, 'Payment setting created'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/payment-settings/:id', adminAuth, async (req, res) => {
  try {
    const { method, label, walletAddress, isActive, sort } = req.body;
    const update = {};
    if (method !== undefined) update.method = method;
    if (label !== undefined) update.label = label;
    if (walletAddress !== undefined) update.walletAddress = walletAddress;
    if (isActive !== undefined) update.isActive = isActive;
    if (sort !== undefined) update.sort = sort;
    const doc = await PaymentSetting.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.json(fail('Payment setting not found'));
    res.json(success(doc, 'Payment setting updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.delete('/payment-settings/:id', adminAuth, async (req, res) => {
  try {
    const doc = await PaymentSetting.findByIdAndDelete(req.params.id);
    if (!doc) return res.json(fail('Payment setting not found'));
    res.json(success(null, 'Payment setting deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Email Settings ----
const EmailSetting = require('../models/EmailSetting');
const emailService = require('../services/emailService');

router.get('/email-settings', adminAuth, async (req, res) => {
  try {
    let settings = await EmailSetting.findOne();
    if (!settings) {
      settings = await EmailSetting.create({});
    }
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/email-settings', adminAuth, async (req, res) => {
  try {
    const allowed = ['host','port','user','pass','fromName','fromEmail','sendOrderConfirmation','sendPaymentConfirmation','sendShippingUpdate','sendRefundNotification'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    let settings = await EmailSetting.findOne();
    if (!settings) {
      settings = await EmailSetting.create(update);
    } else {
      Object.assign(settings, update);
      await settings.save();
    }
    emailService.clearTransporterCache();
    res.json(success(settings, 'Email settings updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- TEMPORARY: Fix ALL product images ----
router.post('/finalize-product-images', adminAuth, async (req, res) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    const fs = require('fs');
    const path = require('path');
    const Product = require('../models/Product');

    const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
    const PHOTOS_DIR = path.join(UPLOADS_DIR, 'product_photos');

    function normalize(s) {
      return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const stopWords = new Set([
      'the','and','for','with','new','from','this','that','have','not',
      'are','was','but','all','can','has','its','our','you','your',
      'size','color','inch','xxx','xxl','xl','xs','s','m','l',
      'black','white','red','blue','green','gold','silver','pink',
      'style','type','high','quality','best','hot','sale','new',
      'design','fashion','brand','genuine','original','premium',
      'leather','fabric','cotton','polyester','nylon','wool',
      'women','men','kids','girl','boy','adult',
      '1','2','3','4','5','free','shipping',
    ]);

    function getKeywords(s) {
      return normalize(s).split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    }

    function matchScore(productName, imageName) {
      const pWords = getKeywords(productName);
      const iWords = getKeywords(imageName);
      if (pWords.length === 0 || iWords.length === 0) return 0;
      const common = pWords.filter(w => iWords.includes(w));
      if (common.length === 0) return 0;
      const score = common.length / Math.max(pWords.length, iWords.length);
      const brandBonus = iWords.includes(pWords[0]) ? 0.3 : 0;
      return score + brandBonus;
    }

    function fileExists(p) {
      try { fs.accessSync(p); return true } catch { return false }
    }

    let photoFiles = [];
    try { photoFiles = fs.readdirSync(PHOTOS_DIR).filter(f => /\.(webp|png|jpg|jpeg|avif|jfif|gif)$/i.test(f)); } catch {}

    const genericFiles = [];
    for (let i = 0; i < 100; i++) {
      const p = path.join(UPLOADS_DIR, `product_${i}.png`);
      if (fileExists(p)) genericFiles.push(`product_${i}.png`);
    }

    const products = await Product.find({});
    const updated = [];
    let updatedCount = 0;
    let genericIndex = 0;

    for (const product of products) {
      const currentImages = (product.images || []).filter(i => i);
      const anyValid = currentImages.some(img => {
        if (img.startsWith('/uploads/')) {
          const f = path.join(UPLOADS_DIR, img.replace('/uploads/', ''));
          return fileExists(f);
        }
        return img.startsWith('http://') || img.startsWith('https://');
      });
      if (anyValid) continue;

      let bestMatch = null;
      let bestScore = 0;

      for (const photoFile of photoFiles) {
        const photoName = path.parse(photoFile).name;
        const score = matchScore(product.name, photoName);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = photoFile;
        }
      }

      let srcPath = null;
      let newFilename = null;

      if (bestMatch && bestScore >= 0.3) {
        const ext = path.extname(bestMatch);
        newFilename = uuidv4() + ext;
        srcPath = path.join(PHOTOS_DIR, bestMatch);
      } else if (genericFiles.length > 0) {
        const gf = genericFiles[genericIndex % genericFiles.length];
        genericIndex++;
        newFilename = uuidv4() + '.png';
        srcPath = path.join(UPLOADS_DIR, gf);
      }

      if (srcPath && newFilename) {
        const dstPath = path.join(UPLOADS_DIR, newFilename);
        try {
          fs.copyFileSync(srcPath, dstPath);
          product.images = ['/uploads/' + newFilename];
          await product.save();
          updatedCount++;
          updated.push({
            productId: product._id,
            name: product.name.substring(0, 60),
            image: '/uploads/' + newFilename,
            matchFile: bestMatch || genericFiles[(genericIndex - 1) % genericFiles.length],
            score: bestScore || 0,
          });
        } catch (e) {}
      }
    }

    res.json(success({
      total: products.length,
      updated: updatedCount,
      details: updated,
    }, `Fixed ${updatedCount} of ${products.length} products`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Remap all product images to generic product_X.png files that exist on disk ----
router.post('/fix-product-images-generic', adminAuth, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const Product = require('../models/Product');

    const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

    // Discover which generic product_X.png files actually exist
    const genericFiles = [];
    for (let i = 0; ; i++) {
      const p = path.join(UPLOADS_DIR, `product_${i}.png`);
      try { fs.accessSync(p); genericFiles.push(`product_${i}.png`); }
      catch { break; }
    }

    if (genericFiles.length === 0) {
      return res.json(fail('No generic product images found'));
    }

    const products = await Product.find({
      images: { $exists: true, $ne: [] },
      $or: [
        { 'images.0': { $regex: /^\/uploads\/[0-9a-f-]+\.(png|jpg|jpeg|webp)$/ } },
      ]
    });

    const updated = [];
    let updatedCount = 0;
    let genericIndex = 0;

    for (const product of products) {
      const oldImage = product.images?.[0];
      if (!oldImage) continue;

      // Check if this is a UUID-based local path
      const match = oldImage.match(/^\/uploads\/([0-9a-f-]+)\.(png|jpg|jpeg|webp)$/);
      if (!match) continue;

      // Check if the referenced file actually exists
      const filePath = path.join(UPLOADS_DIR, match[1] + '.' + match[2]);
      try {
        fs.accessSync(filePath);
        continue; // file exists, skip
      } catch {}

      // Replace with a generic product image
      const gf = genericFiles[genericIndex % genericFiles.length];
      genericIndex++;
      product.images = ['/uploads/' + gf];
      await product.save();
      updatedCount++;
      updated.push({
        productId: product._id,
        name: product.name.substring(0, 60),
        oldImage,
        newImage: '/uploads/' + gf,
      });
    }

    res.json(success({
      total: products.length,
      updated: updatedCount,
      genericFilesAvailable: genericFiles.length,
      details: updated,
    }, `Fixed ${updatedCount} of ${products.length} products with missing images`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Batch update product images from pre-computed mappings ----
router.post('/batch-update-images', adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { mappings } = req.body || {};
    if (!mappings || !Array.isArray(mappings) || mappings.length === 0) {
      return res.json(fail('mappings array required'));
    }

    const results = [];
    let updated = 0;
    let errors = 0;

    for (const item of mappings) {
      try {
        const product = await Product.findById(item.productId);
        if (!product) {
          results.push({ productId: item.productId, status: 'not_found' });
          errors++;
          continue;
        }
        product.images = [item.newImage];
        await product.save();
        results.push({ productId: item.productId, status: 'ok', name: product.name.substring(0, 50), newImage: item.newImage });
        updated++;
      } catch (e) {
        results.push({ productId: item.productId, status: 'error', error: e.message });
        errors++;
      }
    }

    res.json(success({
      total: mappings.length,
      updated,
      errors,
      results,
    }, `Updated ${updated} of ${mappings.length} product images`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Get ordered product IDs (for cleanup of no-image products) ----
router.post('/product-order-ids', adminAuth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const orders = await Order.find({}, { items: 1 }).lean();
    const productIds = [...new Set(orders.flatMap(o => o.items.map(i => i.productId?.toString())))]
      .filter(Boolean);
    res.json(success({ productIds }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Balance Management (admin credit/debit) ----
router.get('/balance/users', adminAuth, async (req, res) => {
  try {
    const { keyword, role, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = {};
    if (role) query.role = role;
    if (keyword) {
      const re = new RegExp(keyword, 'i');
      query.$or = [{ username: re }, { email: re }];
    }
    const [users, total] = await Promise.all([
      User.find(query).select('username email role status').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);
    const wallets = await Wallet.find({ userId: { $in: users.map(u => u._id) } });
    const walletMap = {};
    for (const w of wallets) walletMap[w.userId.toString()] = w;
    const list = users.map(u => ({
      _id: u._id,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      balance: walletMap[u._id.toString()]?.balance || 0,
    }));
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/balance/credit', adminAuth, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId) return res.json(fail('userId is required'));
    const num = Number(amount);
    if (!num || num <= 0) return res.json(fail('Amount must be a positive number'));
    const user = await User.findById(userId);
    if (!user) return res.json(fail('User not found'));
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) wallet = await Wallet.create({ userId });
    const tx = await Transaction.create({
      userId, type: 'admin', amount: num,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance + num,
      status: 1,
      description: description ? `Credit: ${description}` : 'Admin credit',
    });
    wallet.balance += num;
    wallet.totalEarned += num;
    await wallet.save();
    tx.balanceAfter = wallet.balance;
    await tx.save();
    res.json(success({ wallet, transaction: tx }, `Credited $${num} to ${user.username}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/balance/debit', adminAuth, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId) return res.json(fail('userId is required'));
    const num = Number(amount);
    if (!num || num <= 0) return res.json(fail('Amount must be a positive number'));
    const user = await User.findById(userId);
    if (!user) return res.json(fail('User not found'));
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) return res.json(fail('User has no wallet'));
    const debitAmount = num;
    if (wallet.balance < debitAmount) return res.json(fail('Insufficient balance'));
    const tx = await Transaction.create({
      userId, type: 'admin', amount: -debitAmount,
      balanceBefore: wallet.balance,
      balanceAfter: wallet.balance - debitAmount,
      status: 1,
      description: description ? `Debit: ${description}` : 'Admin debit',
    });
    wallet.balance -= debitAmount;
    wallet.totalSpent = (wallet.totalSpent || 0) + debitAmount;
    await wallet.save();
    tx.balanceAfter = wallet.balance;
    await tx.save();
    res.json(success({ wallet, transaction: tx }, `Debited $${debitAmount} from ${user.username}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.get('/balance/history', adminAuth, async (req, res) => {
  try {
    const { userId, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { type: 'admin' };
    if (userId) query.userId = userId;
    const [list, total] = await Promise.all([
      Transaction.find(query).populate('userId', 'username email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Transaction.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.get('/settings/theme', adminAuth, themeController.getTheme);
router.post('/settings/theme', adminAuth, themeController.updateTheme);

router.get('/banners', adminAuth, async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      Banner.find().sort({ sort: 1, createdAt: -1 }).skip(skip).limit(limit),
      Banner.countDocuments(),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
});

router.post('/banners/add', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const { title, link, sort, position } = req.body;
    let image = req.body.image || '';
    if (req.file) image = '/uploads/' + req.file.filename;
    if (!image) return res.json(fail('Image is required'));
    const banner = await Banner.create({ title, image, link, sort: Number(sort) || 0, position: position || 'home', status: 1 });
    res.json(success(banner));
  } catch (error) { res.json(fail(error.message)); }
});

router.post('/banners/update/:id', adminAuth, upload.single('file'), async (req, res) => {
  try {
    const update = {};
    if (req.body.title !== undefined) update.title = req.body.title;
    if (req.body.link !== undefined) update.link = req.body.link;
    if (req.body.sort !== undefined) update.sort = Number(req.body.sort);
    if (req.body.position !== undefined) update.position = req.body.position;
    if (req.body.status !== undefined) update.status = Number(req.body.status);
    if (req.file) update.image = '/uploads/' + req.file.filename;
    else if (req.body.image) update.image = req.body.image;
    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!banner) return res.json(fail('Banner not found'));
    res.json(success(banner));
  } catch (error) { res.json(fail(error.message)); }
});

router.post('/banners/delete/:id', adminAuth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.json(fail('Banner not found'));
    res.json(success(null, 'Banner deleted'));
  } catch (error) { res.json(fail(error.message)); }
});

router.post('/users/:id/set-role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) return res.json(fail('Invalid role'));
    if (req.params.id === req.user._id.toString() && role !== req.user.role) {
      return res.json(fail('Cannot change your own role'));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role, permissions: [] }, { new: true }).select('-password');
    if (!user) return res.json(fail('User not found'));
    res.json(success(user));
  } catch (error) { res.json(fail(error.message)); }
});

router.get('/users/:id/permissions', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.json(fail('User not found'));
    const defaultPerms = ROLE_PERMISSIONS[user.role] || [];
    const effectivePerms = user.permissions && user.permissions.length > 0 ? user.permissions : defaultPerms;
    res.json(success({
      role: user.role,
      customPermissions: user.permissions || [],
      effectivePermissions: effectivePerms,
      isUsingDefaults: !user.permissions || user.permissions.length === 0,
      allPermissions: Object.values(PERMISSIONS),
    }));
  } catch (error) { res.json(fail(error.message)); }
});

router.put('/users/:id/permissions', adminAuth, async (req, res) => {
  try {
    const { permissions } = req.body;
    if (!Array.isArray(permissions)) return res.json(fail('Permissions must be an array'));
    const validPerms = Object.values(PERMISSIONS);
    const invalid = permissions.filter(p => !validPerms.includes(p));
    if (invalid.length > 0) return res.json(fail(`Invalid permissions: ${invalid.join(', ')}`));
    if (req.params.id === req.user._id.toString()) {
      return res.json(fail('Cannot modify your own permissions'));
    }
    const user = await User.findByIdAndUpdate(req.params.id, { permissions }, { new: true }).select('-password');
    if (!user) return res.json(fail('User not found'));
    res.json(success(user));
  } catch (error) { res.json(fail(error.message)); }
});

router.get('/roles', adminAuth, async (req, res) => {
  const roles = Object.entries(ROLE_PERMISSIONS).map(([role, perms]) => ({
    role,
    permissions: perms,
    level: require('../config/roles').ROLE_HIERARCHY[role],
  })).sort((a, b) => b.level - a.level);
  res.json(success({ roles, allPermissions: Object.values(PERMISSIONS) }));
});

module.exports = router;
