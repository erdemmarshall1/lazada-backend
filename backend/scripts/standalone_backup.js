const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const archiver = require('archiver');

const BACKUP_DIR = path.join(__dirname, '..', '..', 'Full Backup', 'node_script');

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

const run = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const zipPath = path.join(BACKUP_DIR, `backup_${new Date().toISOString().slice(0, 10)}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.pipe(output);

  for (const { name, model } of models) {
    const docs = await model.find({}).lean();
    archive.append(JSON.stringify(docs, null, 2), { name: `database/${name}.json` });
    console.log(`  Packed ${name}: ${docs.length} documents`);
  }

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadsDir)) {
    archive.directory(uploadsDir, 'uploads');
    console.log('  Packed uploads/');
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
  console.log('  Packed env files');

  const manifest = {
    createdAt: new Date().toISOString(),
    collections: models.map(m => m.name),
    totalCollections: models.length,
    method: 'standalone_script',
  };
  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });

  await archive.finalize();

  await new Promise((resolve) => output.on('close', resolve));

  console.log(`\nBackup complete: ${zipPath}`);
  console.log(`Size: ${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total collections: ${models.length}`);

  await mongoose.disconnect();
};

run().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
