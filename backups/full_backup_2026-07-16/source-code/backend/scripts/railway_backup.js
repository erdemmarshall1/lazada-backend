const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'Full Backup', 'railway_cli');

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

const run = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  fs.mkdirSync(path.join(BACKUP_DIR, 'database'), { recursive: true });

  for (const { name, model } of models) {
    const docs = await model.find({}).lean();
    fs.writeFileSync(path.join(BACKUP_DIR, 'database', `${name}.json`), JSON.stringify(docs, null, 2));
    console.log(`  Dumped ${name}: ${docs.length} documents`);
  }

  const uploadsSrc = path.join(__dirname, '..', 'uploads');
  const uploadsDest = path.join(BACKUP_DIR, 'uploads');
  copyDir(uploadsSrc, uploadsDest);
  console.log('  Copied uploads/');

  const envFiles = [
    { src: path.join(__dirname, '..', '.env'), name: 'backend.env' },
    { src: path.join(__dirname, '..', '..', 'frontend', '.env'), name: 'frontend.env' },
    { src: path.join(__dirname, '..', '..', 'frontend', '.env.production'), name: 'frontend.env.production' },
  ];
  fs.mkdirSync(path.join(BACKUP_DIR, 'env'), { recursive: true });
  for (const { src, name } of envFiles) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(BACKUP_DIR, 'env', name));
    }
  }
  console.log('  Copied env files');

  const manifest = {
    createdAt: new Date().toISOString(),
    collections: models.map(m => m.name),
    totalCollections: models.length,
    method: 'railway_cli',
  };
  fs.writeFileSync(path.join(BACKUP_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nBackup complete: ${BACKUP_DIR}`);
  console.log(`Total collections: ${models.length}`);
  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
