const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const { adminAuth } = require('../middleware/auth');
const { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN } = require('../config/app');
const walletController = require('../controllers/walletController');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const Banner = require('../models/Banner');
const Order = require('../models/Order');
const Submission = require('../models/Submission');
const { success, fail, paginate } = require('../utils/response');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS, hasPermission } = require('../config/roles');
const themeController = require('../controllers/themeController');
const privacyController = require('../controllers/privacyController');
const upload = require('../middleware/upload');

// ---- Admin Authentication ----
const adminGenerateToken = (id) => {
  return jwt.sign({ id, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const adminGenerateRefreshToken = (user) => {
  const version = user.tokenVersion || '';
  return jwt.sign({ id: user._id, type: 'refresh', version }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

const adminIssueTokens = (user) => {
  const token = adminGenerateToken(user._id);
  const refreshToken = adminGenerateRefreshToken(user);
  return { token, refreshToken };
};

const adminRecordLogin = (userId, req, method = 'password', success = true) => {
  const LoginHistory = require('../models/LoginHistory');
  LoginHistory.create({
    userId,
    ip: req.ip || req.connection?.remoteAddress || '',
    userAgent: req.headers?.['user-agent'] || '',
    method,
    success,
  }).catch(() => {});
};

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json(fail('Username and password required'));
    }
    const user = await User.findOne({
      $or: [{ email: username }, { username }, { phone: username }],
    });
    if (!user) {
      return res.json(fail('User not found'));
    }
    if (!['admin', 'super_admin', 'manager', 'staff'].includes(user.role)) {
      return res.json(fail('Admin access required'));
    }
    if (user.status === 0) {
      return res.json(fail('Account disabled'));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.json(fail('Invalid password'));
    }
    if (user.twoFactorEnabled) {
      adminRecordLogin(user._id, req, 'password', true);
      const tempToken = jwt.sign({ id: user._id, twoFactorPending: true }, JWT_SECRET, { expiresIn: '5m' });
      return res.json(success({ twoFactorRequired: true, tempToken, method: user.twoFactorMethod }, '2FA verification required'));
    }
    adminRecordLogin(user._id, req, 'password', true);
    const tokens = adminIssueTokens(user);
    const extra = user.needsPasswordSetup ? { needsPasswordSetup: true } : {};
    res.json(success({ ...tokens, userInfo: user, ...extra }, 'Login successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/auth/login/2fa', async (req, res) => {
  try {
    const { tempToken, token: twoFactorCode } = req.body;
    if (!tempToken || !twoFactorCode) {
      return res.json(fail('Temporary token and 2FA code required'));
    }
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.json(fail('Temporary token expired or invalid'));
    }
    if (!decoded.twoFactorPending) {
      return res.json(fail('Invalid token'));
    }
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.json(fail('User not found'));
    }
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2,
    });
    if (verified) {
      adminRecordLogin(user._id, req, '2fa', true);
      const tokens = adminIssueTokens(user);
      return res.json(success({ ...tokens, userInfo: user }, 'Login successful'));
    }
    const isBackup = user.backupCodes.find(c => bcrypt.compareSync(twoFactorCode, c));
    if (isBackup) {
      user.backupCodes = user.backupCodes.filter(c => c !== isBackup);
      await user.save();
      adminRecordLogin(user._id, req, 'backup_code', true);
      const tokens = adminIssueTokens(user);
      return res.json(success({ ...tokens, userInfo: user }, 'Login successful (backup code used)'));
    }
    adminRecordLogin(user._id, req, '2fa', false);
    res.json(fail('Invalid 2FA code'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.json(fail('Refresh token required'));
    }
    const { verifyRefreshToken } = require('../middleware/auth');
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== 'refresh') {
      return res.json({ code: -1, msg: 'Invalid or expired refresh token' });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.status === 0) {
      return res.json({ code: -1, msg: 'User not found or disabled' });
    }
    if (user.tokenVersion && decoded.version !== user.tokenVersion) {
      return res.json({ code: -1, msg: 'Refresh token revoked' });
    }
    const tokens = adminIssueTokens(user);
    res.json(success({ ...tokens, userInfo: user }, 'Token refreshed'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/auth/logout', adminAuth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const user = await User.findById(req.user._id);
    if (user) {
      user.tokenVersion = crypto.randomBytes(8).toString('hex');
      await user.save();
    }
    res.json(success(null, 'Logged out successfully'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

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
      Shop.find(query).populate('userId', 'sellerId username').sort({ createdAt: -1 }).skip(skip).limit(limit),
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
    const storeCounter = await Counter.findOneAndUpdate(
      { name: 'storeNumber' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const storeNumber = `${storeCounter.seq}`;
    
    await Counter.updateOne(
      { name: 'sellerId' },
      { $setOnInsert: { seq: 171910 } },
      { upsert: true }
    );
    const sellerCounter = await Counter.findOneAndUpdate(
      { name: 'sellerId' },
      { $inc: { seq: 1 } },
      { new: true }
    );
    const sellerId = `${sellerCounter.seq}`;
    
    const shop = await Shop.findByIdAndUpdate(req.body.id, { 
      status: 1, 
      storeNumber 
    }, { new: true });
    if (!shop) return res.json(fail('Shop not found'));
    await User.findByIdAndUpdate(shop.userId, { role: 'seller', sellerId });
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

router.post('/generate-seller-id', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const { id } = req.body;
    if (!id) return res.json(fail('Shop id is required'));
    const shop = await Shop.findById(id);
    if (!shop) return res.json(fail('Shop not found'));
    await Counter.updateOne(
      { name: 'sellerId' },
      { $setOnInsert: { seq: 171910 } },
      { upsert: true }
    );
    const sellerCounter = await Counter.findOneAndUpdate(
      { name: 'sellerId' },
      { $inc: { seq: 1 } },
      { new: true }
    );
    const sellerId = `${sellerCounter.seq}`;
    await User.findByIdAndUpdate(shop.userId, { sellerId });
    res.json(success({ sellerId }, `Seller ID generated: ${sellerId}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.get('/shops/:id', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('userId', 'username email role');
    if (!shop) return res.json(fail('Shop not found'));
    res.json(success(shop));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/migrate-seller-ids', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const approvedShops = await Shop.find({ status: 1 }).populate('userId', 'sellerId');
    let migrated = 0;
    for (const shop of approvedShops) {
      if (!shop.userId || shop.userId.sellerId) continue;
      await Counter.updateOne(
        { name: 'sellerId' },
        { $setOnInsert: { seq: 101127 } },
        { upsert: true }
      );
      const sellerCounter = await Counter.findOneAndUpdate(
        { name: 'sellerId' },
        { $inc: { seq: 1 } },
        { new: true }
      );
      const sellerId = `${sellerCounter.seq}`;
      await User.findByIdAndUpdate(shop.userId._id, { sellerId });
      migrated++;
    }
    res.json(success({ migrated }, `Migrated ${migrated} seller(s)`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/backfill-store-numbers', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    if (req.body.startFrom) {
      await Counter.findOneAndUpdate(
        { name: 'storeNumber' },
        { $set: { seq: req.body.startFrom - 1 } },
        { upsert: true }
      );
    }
    const shops = await Shop.find({ status: 1 }).sort({ createdAt: 1 });
    let updated = 0;
    for (const shop of shops) {
      const counter = await Counter.findOneAndUpdate(
        { name: 'storeNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      shop.storeNumber = `${counter.seq}`;
      await shop.save();
      updated++;
    }
    res.json(success({ updated }, `Backfilled ${updated} store number(s)`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/login-as-seller/:userId', adminAuth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.userId).select('-password');
    if (!targetUser) return res.json(fail('User not found'));
    const token = jwt.sign(
      { id: targetUser._id, role: targetUser.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json(success({ token, sellerId: targetUser.sellerId, username: targetUser.username }));
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

// ---- Payment Approval Settings ----
const Setting = require('../models/Setting');

router.get('/payment-approval-settings', adminAuth, async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'payment_approval' });
    if (!setting) {
      setting = await Setting.create({
        key: 'payment_approval',
        value: {
          autoApprove: false,
          autoApproveAmount: 0,
          notifyOnSubmit: true,
        },
        type: 'json',
        label: 'Payment Approval Settings',
        description: 'Configure payment approval behavior',
      });
    }
    res.json(success(setting.value));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/payment-approval-settings', adminAuth, async (req, res) => {
  try {
    const { autoApprove, autoApproveAmount, notifyOnSubmit } = req.body;
    const setting = await Setting.findOneAndUpdate(
      { key: 'payment_approval' },
      {
        value: {
          autoApprove: !!autoApprove,
          autoApproveAmount: Math.max(0, Number(autoApproveAmount) || 0),
          notifyOnSubmit: notifyOnSubmit !== undefined ? !!notifyOnSubmit : true,
        },
        type: 'json',
      },
      { new: true, upsert: true }
    );
    res.json(success(setting.value, 'Payment approval settings updated'));
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

// ---- Remap broken local product images to the placeholder endpoint ----
router.post('/fix-product-images-generic', adminAuth, async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const Product = require('../models/Product');

    const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
    const BASE = `https://${req.get('host')}`;
    const LABELS = ['Product', 'Item', 'Merchandise', 'Goods', 'Article', 'Commodity', 'Stock', 'Supply', 'Inventory', 'Piece'];

    const products = await Product.find({
      images: { $exists: true, $ne: [] },
      $or: [
        { 'images.0': { $regex: /^\/uploads\/[0-9a-f-]+\.(png|jpg|jpeg|webp)$/ } },
      ]
    });

    const updated = [];
    let updatedCount = 0;
    let labelIndex = 0;

    for (const product of products) {
      const oldImage = product.images?.[0];
      if (!oldImage) continue;

      const match = oldImage.match(/^\/uploads\/([0-9a-f-]+)\.(png|jpg|jpeg|webp)$/);
      if (!match) continue;

      const filePath = path.join(UPLOADS_DIR, match[1] + '.' + match[2]);
      try {
        fs.accessSync(filePath);
        continue;
      } catch {}

      const label = LABELS[labelIndex % LABELS.length];
      labelIndex++;
      product.images = [`${BASE}/home/image/placeholder?text=${encodeURIComponent(label)}`];
      await product.save();
      updatedCount++;
      updated.push({
        productId: product._id,
        name: product.name.substring(0, 60),
        oldImage,
        newImage: `${BASE}/home/image/placeholder?text=${encodeURIComponent(label)}`,
      });
    }

    res.json(success({
      total: products.length,
      updated: updatedCount,
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

router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.json(fail('Password must be at least 6 characters'));
    const user = await User.findById(req.params.id);
    if (!user) return res.json(fail('User not found'));
    user.password = password;
    await user.save();
    res.json(success({ message: 'Password reset successfully' }));
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

// ---- Admin: full user detail ----
router.get('/users/:id/detail', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -fundPassword -backupCodes -twoFactorSecret');
    if (!user) return res.json(fail('User not found'));
    const [orderCount, submissionCount, wallet] = await Promise.all([
      Order.countDocuments({ userId: req.params.id }),
      Submission.countDocuments({ userId: req.params.id }),
      Wallet.findOne({ userId: req.params.id }),
    ]);
    res.json(success({
      ...user.toObject(),
      orderCount,
      submissionCount,
      walletBalance: wallet?.balance || 0,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: user orders ----
router.get('/users/:id/orders', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { skip, limit } = paginate(page, pageSize);
    const filter = { userId: req.params.id };
    const [list, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Admin: user submissions ----
router.get('/users/:id/submissions', adminAuth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { skip, limit } = paginate(page, pageSize);
    const filter = { userId: req.params.id };
    const [list, total] = await Promise.all([
      Submission.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Submission.countDocuments(filter),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Tawk.to Chat Settings ----
router.get('/tawkto-settings', adminAuth, async (req, res) => {
  try {
    const TawkToSetting = require('../models/TawkToSetting');
    let settings = await TawkToSetting.findOne();
    if (!settings) settings = await TawkToSetting.create({});
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/tawkto-settings', adminAuth, async (req, res) => {
  try {
    const TawkToSetting = require('../models/TawkToSetting');
    const { enabled, widgetId, widgetPosition, widgetColor } = req.body;
    let settings = await TawkToSetting.findOne();
    if (!settings) settings = new TawkToSetting();
    if (enabled !== undefined) settings.enabled = enabled;
    if (widgetId !== undefined) settings.widgetId = widgetId;
    if (widgetPosition !== undefined) settings.widgetPosition = widgetPosition;
    if (widgetColor !== undefined) settings.widgetColor = widgetColor;
    await settings.save();
    res.json(success(settings, 'Tawk.to settings saved'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Chatwoot Chat Settings ----
router.get('/chatwoot-settings', adminAuth, async (req, res) => {
  try {
    const ChatwootSetting = require('../models/ChatwootSetting');
    let settings = await ChatwootSetting.findOne();
    if (!settings) settings = await ChatwootSetting.create({});
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/chatwoot-settings', adminAuth, async (req, res) => {
  try {
    const ChatwootSetting = require('../models/ChatwootSetting');
    const { enabled, websiteToken, baseUrl } = req.body;
    let settings = await ChatwootSetting.findOne();
    if (!settings) settings = new ChatwootSetting();
    if (enabled !== undefined) settings.enabled = enabled;
    if (websiteToken !== undefined) settings.websiteToken = websiteToken;
    if (baseUrl !== undefined) settings.baseUrl = baseUrl;
    await settings.save();
    res.json(success(settings, 'Chatwoot settings saved'));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Seller ID Settings ----
router.get('/seller-id-settings', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const counter = await Counter.findOne({ name: 'sellerId' });
    const sellers = await User.find({ sellerId: { $exists: true, $ne: '' } })
      .select('sellerId username email role')
      .sort({ sellerId: 1 });
    res.json(success({ counter: counter || { name: 'sellerId', seq: 171910 }, sellers }));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.put('/seller-id-settings', adminAuth, async (req, res) => {
  try {
    const Counter = require('../models/Counter');
    const { startingNumber } = req.body;
    if (startingNumber === undefined || typeof startingNumber !== 'number' || startingNumber < 1) {
      return res.json(fail('Starting number must be a positive integer'));
    }
    await Counter.updateOne(
      { name: 'sellerId' },
      { $set: { seq: startingNumber } },
      { upsert: true }
    );
    const counter = await Counter.findOne({ name: 'sellerId' });
    res.json(success(counter, `Seller ID counter set to ${startingNumber}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

router.post('/seller-id-override', adminAuth, async (req, res) => {
  try {
    const { userId, sellerId } = req.body;
    if (!userId || !sellerId) {
      return res.json(fail('userId and sellerId are required'));
    }
    const existing = await User.findOne({ sellerId, _id: { $ne: userId } });
    if (existing) {
      return res.json(fail(`Seller ID ${sellerId} is already assigned to another user`));
    }
    const user = await User.findByIdAndUpdate(userId, { sellerId }, { new: true });
    if (!user) return res.json(fail('User not found'));
    res.json(success({ userId: user._id, sellerId: user.sellerId }, `Seller ID updated to ${sellerId}`));
  } catch (error) {
    res.json(fail(error.message));
  }
});

// ---- Logistics Management ----
const Shipping = require('../models/Shipping');
const ShippingMethod = require('../models/ShippingMethod');

const CARRIERS = [
  { id: 'sf', name: 'SF Express' },
  { id: 'yto', name: 'YTO Express' },
  { id: 'zto', name: 'ZTO Express' },
  { id: 'sto', name: 'STO Express' },
  { id: 'yd', name: 'Yunda Express' },
  { id: 'ems', name: 'EMS' },
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'dhl', name: 'DHL' },
  { id: 'tnt', name: 'TNT' },
];

const TRACKING_STATUS = {
  0: 'Pending Pickup', 1: 'Picked Up', 2: 'In Transit',
  3: 'Out for Delivery', 4: 'Delivered', 5: 'Delivery Failed', 6: 'Returned',
};

router.get('/logistics/stats', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.shopId) filter.shopId = req.query.shopId;
    const stats = await Shipping.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const result = { total: 0 };
    Object.keys(TRACKING_STATUS).forEach(k => { result[k] = 0; });
    stats.forEach(s => { result[s._id] = s.count; result.total += s.count; });
    res.json(success({ stats: result, labels: TRACKING_STATUS }));
  } catch (error) { res.json(fail(error.message)); }
});

router.get('/logistics/carriers', adminAuth, async (req, res) => {
  res.json(success(CARRIERS));
});

router.get('/logistics', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status !== undefined && req.query.status !== '') filter.status = parseInt(req.query.status);
    if (req.query.carrier) filter.carrier = req.query.carrier;
    if (req.query.shopId) filter.shopId = req.query.shopId;
    if (req.query.search) {
      const orders = await Order.find({ orderNo: { $regex: req.query.search, $options: 'i' } }).select('_id');
      filter.orderId = { $in: orders.map(o => o._id) };
    }
    const { skip, limit, page, pageSize } = paginate(req.query.page, req.query.pageSize || 20);
    const [list, total] = await Promise.all([
      Shipping.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate({ path: 'orderId', select: 'orderNo finalAmount status userId' })
        .populate({ path: 'shopId', select: 'name' }),
      Shipping.countDocuments(filter),
    ]);
    res.json(success({
      list: list.map(s => ({
        ...s.toObject(),
        statusLabel: TRACKING_STATUS[s.status] || 'Unknown',
      })),
      total, page, pageSize,
    }));
  } catch (error) { res.json(fail(error.message)); }
});

router.get('/logistics/:id', adminAuth, async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id)
      .populate({ path: 'orderId', select: 'orderNo finalAmount status userId createdAt' })
      .populate({ path: 'shopId', select: 'name' });
    if (!shipping) return res.json(fail('Shipping record not found'));
    res.json(success({
      ...shipping.toObject(),
      statusLabel: TRACKING_STATUS[shipping.status] || 'Unknown',
      statusHistory: (shipping.statusHistory || []).map(h => ({
        ...h, statusLabel: TRACKING_STATUS[h.status] || 'Unknown',
      })),
    }));
  } catch (error) { res.json(fail(error.message)); }
});

router.put('/logistics/:id/tracking', adminAuth, async (req, res) => {
  try {
    const { newStatus, location, description } = req.body;
    if (newStatus === undefined) return res.json(fail('newStatus is required'));
    const shipping = await Shipping.findById(req.params.id);
    if (!shipping) return res.json(fail('Shipping record not found'));
    shipping.statusHistory.push({
      status: newStatus, location: location || '',
      description: description || TRACKING_STATUS[newStatus] || 'Status updated',
      timestamp: new Date(),
    });
    shipping.status = newStatus;
    if (newStatus === 4) shipping.deliveredAt = new Date();
    await shipping.save();
    const order = await Order.findById(shipping.orderId);
    const io = req.app?.get('io');
    if (io && order) {
      io.to(`user_${order.userId}`).emit('trackingUpdated', {
        orderId: order._id, trackingNo: shipping.trackingNo,
        status: newStatus, statusLabel: TRACKING_STATUS[newStatus] || 'Unknown',
        message: `Your order ${order.orderNo} tracking updated: ${TRACKING_STATUS[newStatus] || 'Status updated'}`,
      });
    }
    res.json(success(shipping, 'Tracking updated'));
  } catch (error) { res.json(fail(error.message)); }
});

// ---- Shipping Methods (Admin override of settings routes) ----
router.get('/logistics/shipping-methods', adminAuth, async (req, res) => {
  try {
    const methods = await ShippingMethod.find().sort({ sort: 1 });
    res.json(success(methods));
  } catch (error) { res.json(fail(error.message)); }
});

router.post('/logistics/shipping-methods', adminAuth, async (req, res) => {
  try {
    const { name, carrier, type, rate, freeShippingThreshold, estimatedDays, regions, status, sort } = req.body;
    if (!name) return res.json(fail('Name is required'));
    const method = await ShippingMethod.create({
      name, carrier, type: type || 'flat', rate: rate || 0,
      freeShippingThreshold, estimatedDays: estimatedDays || '3-7',
      regions: regions || [], status: status !== undefined ? status : 1, sort: sort || 0,
    });
    res.json(success(method, 'Shipping method created'));
  } catch (error) { res.json(fail(error.message)); }
});

router.put('/logistics/shipping-methods/:id', adminAuth, async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!method) return res.json(fail('Shipping method not found'));
    res.json(success(method, 'Shipping method updated'));
  } catch (error) { res.json(fail(error.message)); }
});

router.delete('/logistics/shipping-methods/:id', adminAuth, async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.json(fail('Shipping method not found'));
    res.json(success(null, 'Shipping method deleted'));
  } catch (error) { res.json(fail(error.message)); }
});

// ---- Live Chat Settings ----
router.get('/live-chat-settings', adminAuth, async (req, res) => {
  try {
    const LiveChatSetting = require('../models/LiveChatSetting');
    let settings = await LiveChatSetting.findOne().populate('agentIds', 'username email avatar');
    if (!settings) {
      settings = await LiveChatSetting.create({});
      settings = await LiveChatSetting.findById(settings._id).populate('agentIds', 'username email avatar');
    }
    res.json(success(settings));
  } catch (error) { res.json(fail(error.message)); }
});

router.put('/live-chat-settings', adminAuth, async (req, res) => {
  try {
    const LiveChatSetting = require('../models/LiveChatSetting');
    const { enabled, widgetTitle, widgetColor, widgetPosition, autoGreeting, offlineMessage, agentIds } = req.body;
    let settings = await LiveChatSetting.findOne();
    if (!settings) {
      settings = await LiveChatSetting.create({ enabled, widgetTitle, widgetColor, widgetPosition, autoGreeting, offlineMessage, agentIds });
    } else {
      if (enabled !== undefined) settings.enabled = enabled;
      if (widgetTitle !== undefined) settings.widgetTitle = widgetTitle;
      if (widgetColor !== undefined) settings.widgetColor = widgetColor;
      if (widgetPosition !== undefined) settings.widgetPosition = widgetPosition;
      if (autoGreeting !== undefined) settings.autoGreeting = autoGreeting;
      if (offlineMessage !== undefined) settings.offlineMessage = offlineMessage;
      if (agentIds !== undefined) settings.agentIds = agentIds;
      await settings.save();
    }
    res.json(success(settings, 'Live chat settings saved'));
  } catch (error) { res.json(fail(error.message)); }
});

// ---- Geo / Device Analytics ----
router.get('/geo-devices/summary', adminAuth, async (req, res) => {
  try {
    const LoginHistory = require('../models/LoginHistory');
    const sessions = await LoginHistory.find({}).sort({ createdAt: -1 }).limit(5000).lean();
    const osMap = {}, browserMap = {}, deviceMap = {}, locationMap = {};
    for (const s of sessions) {
      const ua = (s.userAgent || '').toLowerCase();
      let os = 'Other', browser = 'Other', device = 'Desktop';
      if (/windows/.test(ua)) os = 'Windows';
      else if (/macintosh|mac os/.test(ua)) os = 'macOS';
      else if (/linux/.test(ua)) os = 'Linux';
      else if (/android/.test(ua)) { os = 'Android'; device = 'Mobile'; }
      else if (/iphone|ipad|ios/.test(ua)) { os = 'iOS'; device = 'Mobile'; }
      if (/chrome|chromium/.test(ua) && !/edge|opr/.test(ua)) browser = 'Chrome';
      else if (/firefox/.test(ua)) browser = 'Firefox';
      else if (/safari/.test(ua) && !/chrome/.test(ua)) browser = 'Safari';
      else if (/edge/.test(ua)) browser = 'Edge';
      else if (/opr|opera/.test(ua)) browser = 'Opera';
      osMap[os] = (osMap[os] || 0) + 1;
      browserMap[browser] = (browserMap[browser] || 0) + 1;
      deviceMap[device] = (deviceMap[device] || 0) + 1;
      if (s.location) locationMap[s.location] = (locationMap[s.location] || 0) + 1;
    }
    const toArray = (map) => Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    res.json(success({
      os: toArray(osMap), browsers: toArray(browserMap), devices: toArray(deviceMap), locations: toArray(locationMap),
    }));
  } catch (error) { res.json(fail(error.message)); }
});

module.exports = router;
