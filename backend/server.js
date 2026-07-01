const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./config/db');
const { PORT } = require('./config/app');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Stripe webhook needs raw body — mount before JSON middleware
app.use('/home/payment/webhook', express.raw({ type: 'application/json' }), require('./routes/payment'));

// Content-type detection from magic bytes (runs first so wrong extensions get correct MIME)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) return next();
    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      stream.once('data', (chunk) => {
        const type = (chunk[0] === 0xff && chunk[1] === 0xd8) ? 'image/jpeg'
                   : (chunk[0] === 0x89 && chunk[1] === 0x50) ? 'image/png'
                   : (chunk[0] === 0x52 && chunk[1] === 0x49) ? 'image/webp'
                   : 'application/octet-stream';
        res.setHeader('Content-Type', type);
        res.write(chunk);
        stream.pipe(res);
      });
      stream.on('error', next);
    });
    stream.on('error', next);
  });
});

// Static file serving (fallback for files with correct extensions)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conditionally serve frontend static files if the dist directory exists
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

app.use('/main/index', require('./routes/index'));
app.use('/main/sendMsg', require('./routes/auth'));
app.use('/main/user', require('./routes/auth'));
app.use('/main/goodsCategory', require('./routes/category'));
app.use('/main/goods', require('./routes/product'));
app.use('/main/goodsSku', require('./routes/sku'));
app.use('/main/userShop', require('./routes/shop'));
app.use('/main/banner', require('./routes/banner'));
app.use('/main/activity', require('./routes/activity'));
app.use('/main/msg', require('./routes/alert'));
app.use('/main/userMsg', require('./routes/message'));
app.use('/main/lang', require('./routes/index'));
app.use('/main/countryArea', require('./routes/auth'));

app.use('/home/user', require('./routes/user'));
app.use('/home/upload', require('./routes/upload'));
app.use('/home/userOrder', require('./routes/order'));
app.use('/home/userAddress', require('./routes/address'));
app.use('/home/userWallet', require('./routes/wallet'));
app.use('/home/userBank', require('./routes/bank'));
app.use('/home/userRecharge', require('./routes/recharge'));
app.use('/home/userWithdraw', require('./routes/withdraw'));
app.use('/home/userCollect', require('./routes/favorite'));
app.use('/home/goodsReviews', require('./routes/review'));
app.use('/home/goods', require('./routes/storeGoods'));
app.use('/home/userGoods', require('./routes/userGoods'));
app.use('/home/userShop', require('./routes/userShop'));
app.use('/home/userKefu', require('./routes/kefu'));

app.use('/home/trade', require('./routes/trade'));
app.use('/home/userAmount', require('./routes/amount'));

app.use('/api/alert', require('./routes/alert'));
app.use('/home/shipping', require('./routes/shipping'));
app.use('/home/admin', require('./routes/admin'));
app.use('/home/admin/coupons', require('./routes/coupon'));
app.use('/home/userOrder/coupon', require('./routes/coupon'));
app.use('/home/payment', require('./routes/payment'));
app.use('/home/payment-settings', require('./routes/paymentSettings'));
app.use('/home/image', require('./routes/imageProxy'));
app.use('/home/admin', require('./routes/backup'));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  const apiPatterns = ['/main/', '/home/', '/api/', '/uploads/'];
  const isApi = apiPatterns.some(p => req.path.startsWith(p));
  if (isApi) return res.json({ message: 'API route not found' });
  if (fs.existsSync(frontendDist)) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  } else {
    res.json({ message: 'Backend API is running' });
  }
});

const startServer = (dbConnected) => {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} (MongoDB: ${dbConnected ? 'connected' : 'disconnected'})`);
  });

  const io = require('./sockets/chat')(server);
  app.set('io', io);

  const Wallet = require('./models/Wallet');
  Wallet.setIO(io);

  if (dbConnected) {
    const escrowService = require('./services/escrowService');
    escrowService.start();
  }
};

connectDB().then(() => {
  startServer(true);
}).catch(err => {
  console.error('MongoDB connection failed, starting without database:', err.message);
  startServer(false);
});
