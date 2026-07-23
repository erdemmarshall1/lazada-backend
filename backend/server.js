const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const connectDB = require('./config/db');
const { seedAll } = require('./config/db');
const { PORT } = require('./config/app');
require('./config/cloudinary');

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: -2, msg: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/main/sendMsg', authLimiter);
app.use('/main/user/login', authLimiter);
app.use('/main/user/reg', authLimiter);
app.use('/main/user/forgot', authLimiter);
app.use('/main/user/sendResetCode', authLimiter);

// Stripe webhook needs raw body — mount before JSON middleware
app.use('/home/payment/webhook', express.raw({ type: 'application/json' }), require('./routes/payment'));

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Conditionally serve frontend static files if the dist directory exists
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Mount all routes
app.use(require('./routes'));

// Swagger API docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

const themeController = require('./controllers/themeController');
app.get('/home/settings/theme', themeController.getTheme);

// Debug: check if chunk files exist
app.get('/api/debug-files', (req, res) => {
  const fs = require('fs');
  const chunksDir = path.join(__dirname, 'scripts', 'chunks');
  const singleFile = path.join(__dirname, 'scripts', 'scraped_details.json');
  const chunksExist = fs.existsSync(chunksDir);
  const singleExists = fs.existsSync(singleFile);
  const chunks = chunksExist ? fs.readdirSync(chunksDir) : [];
  res.json({
    chunksDir,
    chunksExist,
    chunkCount: chunks.length,
    chunks,
    singleFile,
    singleExists,
    singleSize: singleExists ? fs.statSync(singleFile).size : 0,
    uptime: process.uptime(),
    heap: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
  });
});

// Reimport trigger (protected by REIMPORT_SECRET)
app.get('/api/reimport', async (req, res) => {
  if (req.query.secret !== (process.env.REIMPORT_SECRET || 'reimport123')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  res.json({ message: 'Reimport started' });
  try {
    await require('./config/db').seedScrapedProducts();
  } catch (e) {
    console.error('Reimport error:', e.message);
  }
});

const errorHandler = require('./middleware/errorHandler');

// Error handling middleware
app.use(errorHandler);

// Health check endpoint - define ONCE before SPA fallback
let dbReady = false;
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now(), db: dbReady });
});

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
  global.io = io;
  app.set('io', io);

  const Wallet = require('./models/Wallet');
  Wallet.setIO(io);

  if (dbConnected) {
    const escrowService = require('./services/escrowService');
    escrowService.start();
    const autoClosureService = require('./services/autoClosureService');
    autoClosureService.start();
  }

  // Self-ping to prevent Railway free tier sleep (every 10 minutes)
  const SELF_URL = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.SELF_URL;
  if (SELF_URL) {
    const http = require('http');
    const pingInterval = setInterval(() => {
      const url = `http://${SELF_URL}/health`;
      http.get(url, (res) => {
        console.log(`[keep-alive] Self-ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.log(`[keep-alive] Self-ping error: ${err.message}`);
      });
    }, 10 * 60 * 1000);
    console.log(`[keep-alive] Self-ping enabled every 10 min -> ${SELF_URL}`);
  }
};

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

startServer(false);
connectDB().then(connected => {
  dbReady = connected;
  if (connected) {
    seedAll();
  }
}).catch(err => {
  console.error('MongoDB connection error:', err.message);
});