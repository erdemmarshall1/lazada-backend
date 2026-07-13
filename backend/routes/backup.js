const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');

const BACKUP_ROOT = path.join(__dirname, '..', '..', 'Full Backup');

const models = [
  { name: 'users', model: require('../models/User') },
  { name: 'products', model: require('../models/Product') },
  { name: 'orders', model: require('../models/Order') },
  { name: 'wallets', model: require('../models/Wallet') },
  { name: 'user_wallets', model: require('../models/UserWallet') },
  { name: 'transactions', model: require('../models/Transaction') },
  { name: 'shippings', model: require('../models/Shipping') },
  { name: 'shipping_methods', model: require('../models/ShippingMethod') },
  { name: 'shops', model: require('../models/Shop') },
  { name: 'banners', model: require('../models/Banner') },
  { name: 'categories', model: require('../models/Category') },
  { name: 'coupons', model: require('../models/Coupon') },
  { name: 'messages', model: require('../models/Message') },
  { name: 'platform_wallets', model: require('../models/PlatformWallet') },
  { name: 'platform_transactions', model: require('../models/PlatformTransaction') },
  { name: 'reviews', model: require('../models/Review') },
  { name: 'addresses', model: require('../models/Address') },
  { name: 'payment_settings', model: require('../models/PaymentSetting') },
  { name: 'invitation_codes', model: require('../models/InvitationCode') },
  { name: 'carts', model: require('../models/Cart') },
  { name: 'bank_cards', model: require('../models/BankCard') },
  { name: 'browse_history', model: require('../models/BrowseHistory') },
  { name: 'favorites', model: require('../models/Favorite') },
  { name: 'email_settings', model: require('../models/EmailSetting') },
  { name: 'live_chat_settings', model: require('../models/LiveChatSetting') },
  { name: 'tawkto_settings', model: require('../models/TawkToSetting') },
  { name: 'chatwoot_settings', model: require('../models/ChatwootSetting') },
  { name: 'system_settings', model: require('../models/SystemSettings') },
  { name: 'settings', model: require('../models/Setting') },
  { name: 'counters', model: require('../models/Counter') },
  { name: 'homepage_sections', model: require('../models/HomepageSection') },
  { name: 'pages', model: require('../models/Page') },
  { name: 'blogs', model: require('../models/Blog') },
  { name: 'faqs', model: require('../models/Faq') },
  { name: 'menus', model: require('../models/Menu') },
  { name: 'notifications', model: require('../models/Notification') },
  { name: 'login_history', model: require('../models/LoginHistory') },
  { name: 'audit_logs', model: require('../models/AuditLog') },
  { name: 'submissions', model: require('../models/Submission') },
  { name: 'sessions', model: require('../models/Session') },
  { name: 'push_subscriptions', model: require('../models/PushSubscription') },
  { name: 'tax_rates', model: require('../models/TaxRate') },
  { name: 'currencies', model: require('../models/Currency') },
];

const dumpAllCollections = async () => {
  const results = {};
  for (const { name, model } of models) {
    const docs = await model.find({}).lean();
    results[name] = docs;
  }
  return results;
};

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const s = path.join(src, item);
    const d = path.join(dest, item);
    if (fs.lstatSync(s).isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
};

const getEnvFiles = () => [
  { src: path.join(__dirname, '..', '.env'), name: 'backend.env' },
  { src: path.join(__dirname, '..', '..', 'frontend', '.env'), name: 'frontend.env' },
  { src: path.join(__dirname, '..', '..', 'frontend', '.env.production'), name: 'frontend.env.production' },
];

const buildManifest = (method) => ({
  createdAt: new Date().toISOString(),
  collections: models.map(m => m.name),
  totalCollections: models.length,
  method,
});

// ── Method A: Download zip via HTTP ────────────────
router.post('/backup', adminAuth, async (req, res) => {
  try {
    const data = await dumpAllCollections();
    const archive = archiver('zip', { zlib: { level: 1 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="full_backup_${new Date().toISOString().slice(0, 10)}.zip"`);
    archive.pipe(res);

    for (const [name, docs] of Object.entries(data)) {
      archive.append(JSON.stringify(docs, null, 2), { name: `database/${name}.json` });
    }

    for (const { src, name } of getEnvFiles()) {
      if (fs.existsSync(src)) {
        archive.file(src, { name: `env/${name}` });
      }
    }

    archive.append(JSON.stringify(buildManifest('endpoint_download'), null, 2), { name: 'manifest.json' });
    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Method D: Dump all DB data as JSON (fast, no uploads) ──
router.post('/backup/d', adminAuth, async (req, res) => {
  try {
    const data = await dumpAllCollections();
    res.json({ success: true, data, manifest: buildManifest('json_dump') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Method B: Save JSON folder to Railway filesystem ──
router.post('/backup/b', adminAuth, async (req, res) => {
  try {
    const dest = path.join(BACKUP_ROOT, 'railway_cli');
    fs.mkdirSync(path.join(dest, 'database'), { recursive: true });

    const data = await dumpAllCollections();
    for (const [name, docs] of Object.entries(data)) {
      fs.writeFileSync(path.join(dest, 'database', `${name}.json`), JSON.stringify(docs, null, 2));
    }

    const uploadsSrc = path.join(__dirname, '..', 'uploads');
    copyDir(uploadsSrc, path.join(dest, 'uploads'));

    fs.mkdirSync(path.join(dest, 'env'), { recursive: true });
    for (const { src, name } of getEnvFiles()) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(dest, 'env', name));
      }
    }

    fs.writeFileSync(path.join(dest, 'manifest.json'), JSON.stringify(buildManifest('railway_cli'), null, 2));

    res.json({ success: true, path: dest, note: `Backup saved to ${dest}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Method C: Save zip to Railway filesystem ──
router.post('/backup/c', adminAuth, async (req, res) => {
  try {
    const dest = path.join(BACKUP_ROOT, 'node_script');
    fs.mkdirSync(dest, { recursive: true });

    const zipPath = path.join(dest, `backup_${new Date().toISOString().slice(0, 10)}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(output);

    const data = await dumpAllCollections();
    for (const [name, docs] of Object.entries(data)) {
      archive.append(JSON.stringify(docs, null, 2), { name: `database/${name}.json` });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    for (const { src, name } of getEnvFiles()) {
      if (fs.existsSync(src)) {
        archive.file(src, { name: `env/${name}` });
      }
    }

    archive.append(JSON.stringify(buildManifest('standalone_script'), null, 2), { name: 'manifest.json' });
    archive.finalize();

    await new Promise((resolve) => output.on('close', resolve));

    const size = fs.statSync(zipPath).size;
    res.json({ success: true, path: zipPath, size, sizeMB: (size / 1024 / 1024).toFixed(2) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
