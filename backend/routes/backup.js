const express = require('express');
const router = express.Router();
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');

const models = [
  { name: 'users', model: require('../models/User') },
  { name: 'products', model: require('../models/Product') },
  { name: 'orders', model: require('../models/Order') },
  { name: 'wallets', model: require('../models/Wallet') },
  { name: 'transactions', model: require('../models/Transaction') },
  { name: 'shippings', model: require('../models/Shipping') },
  { name: 'shops', model: require('../models/Shop') },
  { name: 'banners', model: require('../models/Banner') },
  { name: 'categories', model: require('../models/Category') },
  { name: 'coupons', model: require('../models/Coupon') },
  { name: 'messages', model: require('../models/Message') },
  { name: 'platform_wallets', model: require('../models/PlatformWallet') },
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
];

router.post('/backup', adminAuth, async (req, res) => {
  try {
    const archive = archiver('zip', { zlib: { level: 9 } });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="full_backup_${new Date().toISOString().slice(0, 10)}.zip"`);
    archive.pipe(res);

    for (const { name, model } of models) {
      const docs = await model.find({}).lean();
      archive.append(JSON.stringify(docs, null, 2), { name: `database/${name}.json` });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      archive.directory(uploadsDir, 'uploads');
    }

    const envFiles = [
      { src: path.join(__dirname, '..', '.env'), name: 'backend.env' },
      { src: path.join(__dirname, '..', '..', 'frontend', '.env'), name: 'frontend.env' },
      { src: path.join(__dirname, '..', '..', 'frontend', '.env.production'), name: 'frontend.env.production' },
    ];
    for (const { src, name } of envFiles) {
      if (fs.existsSync(src)) {
        archive.file(src, { name: `env/${name}` });
      }
    }

    const manifest = {
      createdAt: new Date().toISOString(),
      collections: models.map(m => m.name),
      totalCollections: models.length,
      note: 'Full backup from Railway backend endpoint',
    };
    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
