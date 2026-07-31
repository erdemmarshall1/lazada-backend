const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { adminAuth, superAdminAuth } = require('../middleware/auth');
const { success, fail } = require('../utils/response');

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
    res.status(500).json(fail(err.message));
  }
});

// ── Method D: Dump all DB data as JSON (fast, no uploads) ──
router.post('/backup/d', adminAuth, async (req, res) => {
  try {
    const data = await dumpAllCollections();
    res.json({ success: true, data, manifest: buildManifest('json_dump') });
  } catch (err) {
    res.status(500).json(fail(err.message));
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
    res.status(500).json(fail(err.message));
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

// ── Maintenance Mode + Backup Status ─────────────────
router.get('/backup/status', adminAuth, async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    const docs = await Setting.find({ key: { $in: ['maintenanceMode', 'maintenance_message', 'maintenance_until'] } }).lean();
    const map = {};
    for (const d of docs) map[d.key] = d.value;
    let dbStats = null;
    try { dbStats = await mongoose.connection.db.stats(); } catch (e) {}
    res.json(success({
      maintenance: {
        enabled: !!map.maintenanceMode,
        message: map.maintenance_message || '',
        until: map.maintenance_until || null,
      },
      database: {
        collections: dbStats ? dbStats.collections : models.length,
        dataSizeMB: dbStats ? (dbStats.dataSize / 1024 / 1024).toFixed(2) : null,
        storageSizeMB: dbStats ? (dbStats.storageSize / 1024 / 1024).toFixed(2) : null,
      },
      backupCollections: models.length,
    }));
  } catch (error) { res.json(fail(error.message)); }
});

router.put('/maintenance', adminAuth, async (req, res) => {
  try {
    const { enabled, message, until } = req.body;
    const Setting = require('../models/Setting');
    const ops = [
      Setting.findOneAndUpdate({ key: 'maintenanceMode' }, { $set: { value: enabled ? 1 : 0, type: 'number' } }, { upsert: true, new: true }),
      Setting.findOneAndUpdate({ key: 'maintenance_message' }, { $set: { value: message || 'We are currently performing scheduled maintenance. Please check back shortly.' } }, { upsert: true, new: true }),
    ];
    if (until !== undefined) {
      ops.push(Setting.findOneAndUpdate({ key: 'maintenance_until' }, { $set: { value: until || '' } }, { upsert: true, new: true }));
    }
    await Promise.all(ops);
    const { refreshMaintenanceCache } = require('../middleware/maintenance');
    const state = await refreshMaintenanceCache();
    res.json(success(state, enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'));
  } catch (error) { res.json(fail(error.message)); }
});

// ── Backup history (server-side "Full Backup" folder) ──
router.get('/backup/list', adminAuth, async (req, res) => {
  try {
    const items = [];
    if (fs.existsSync(BACKUP_ROOT)) {
      for (const entry of fs.readdirSync(BACKUP_ROOT)) {
        try {
          const fp = path.join(BACKUP_ROOT, entry);
          const st = fs.statSync(fp);
          items.push({
            name: entry,
            isDir: st.isDirectory(),
            sizeMB: st.isDirectory() ? null : (st.size / 1024 / 1024).toFixed(2),
            modifiedAt: st.mtime,
          });
        } catch (e) {}
      }
    }
    items.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    res.json(success(items));
  } catch (error) { res.json(fail(error.message)); }
});

// ── Restore ──────────────────────────────────────────
const multer = require('multer');
const uploadRestore = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const name = (file.originalname || '').toLowerCase();
    if (name.endsWith('.zip') || name.endsWith('.json') || /zip|json/.test(file.mimetype || '')) return cb(null, true);
    cb(new Error('Only .zip or .json backup files are allowed'), false);
  },
});

const COLLECTION_WHITELIST = models.map(m => m.name);

const extractCollections = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {};
  if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) return obj.data;
  if (!obj.success && obj.manifest) return obj;
  return {};
};

const readCollectionsFromZip = (buffer) => new Promise((resolve, reject) => {
  const yauzl = require('yauzl');
  const results = {};
  yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
    if (err) return reject(err);
    zipfile.on('error', reject);
    zipfile.readEntry();
    zipfile.on('entry', (entry) => {
      if (/^database\/.+\.json$/i.test(entry.fileName)) {
        const name = path.basename(entry.fileName, '.json');
        zipfile.openReadStream(entry, (err2, stream) => {
          if (err2) return reject(err2);
          const chunks = [];
          stream.on('data', (c) => chunks.push(c));
          stream.on('end', () => {
            try {
              results[name] = JSON.parse(Buffer.concat(chunks).toString('utf8'));
            } catch (e) {
              results[name] = [];
            }
            zipfile.readEntry();
          });
          stream.on('error', reject);
        });
      } else {
        zipfile.readEntry();
      }
    });
    zipfile.on('end', () => resolve(results));
  });
});

router.post('/backup/restore', superAdminAuth, uploadRestore.single('file'), async (req, res) => {
  try {
    const confirm = req.body?.confirm === 'true' || req.body?.confirm === true;
    if (!confirm) return res.json(fail('You must confirm the restore (confirm: true)'));

    let collectionsData = null;
    if (req.file) {
      const ext = (req.file.originalname || '').toLowerCase();
      if (ext.endsWith('.json')) {
        collectionsData = extractCollections(JSON.parse(req.file.buffer.toString('utf8')));
      } else if (ext.endsWith('.zip')) {
        collectionsData = await readCollectionsFromZip(req.file.buffer);
      } else {
        return res.json(fail('Unsupported backup file type'));
      }
    } else if (req.body?.data) {
      if (typeof req.body.data === 'string') collectionsData = extractCollections(JSON.parse(req.body.data));
      else collectionsData = extractCollections(req.body.data);
    }

    if (!collectionsData || Object.keys(collectionsData).length === 0) {
      return res.json(fail('No collections found in the uploaded backup'));
    }

    const results = {};
    const db = mongoose.connection.db;
    for (const [name, docs] of Object.entries(collectionsData)) {
      if (!COLLECTION_WHITELIST.includes(name)) {
        results[name] = { status: 'skipped', reason: 'not a known collection' };
        continue;
      }
      try {
        const col = db.collection(name);
        const deleted = (await col.deleteMany({})).deletedCount;
        let inserted = 0;
        if (Array.isArray(docs) && docs.length > 0) {
          try {
            const r = await col.insertMany(docs, { ordered: false });
            inserted = Array.isArray(r) ? r.length : (r.insertedCount ?? docs.length);
          } catch (e) {
            inserted = docs.length - (e.writeErrors?.length || 0);
          }
        }
        results[name] = { status: 'ok', deleted, inserted };
      } catch (e) {
        results[name] = { status: 'error', error: e.message };
      }
    }

    const { refreshMaintenanceCache } = require('../middleware/maintenance');
    await refreshMaintenanceCache();
    res.json(success(results, 'Restore complete'));
  } catch (error) {
    res.status(500).json(fail(error.message));
  }
});

module.exports = router;
