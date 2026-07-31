const path = require('path');

const CACHE_TTL = 10 * 1000;

let cache = { enabled: false, message: '', until: null, at: 0 };

const BYPASS_PREFIXES = [
  '/home/admin',
  '/admin',
  '/uploads',
  '/health',
  '/api-docs',
  '/api/reimport',
  '/api/reseed',
  '/api/translate',
  '/api/bulk-import',
  '/home/image',
  '/home/payment/webhook',
];

const STATIC_EXT_RE = /\.(js|css|png|jpe?g|gif|svg|ico|woff2?|ttf|otf|eot|map|json|txt|webmanifest|avif|webp)$/i;

const isStaticAsset = (p) => STATIC_EXT_RE.test(path.extname(p).toLowerCase()) || p.startsWith('/assets/');

const DEFAULT_MESSAGE = 'We are currently performing scheduled maintenance. Please check back shortly.';

async function readMaintenanceState() {
  const Setting = require('../models/Setting');
  const docs = await Setting.find({ key: { $in: ['maintenanceMode', 'maintenance_message', 'maintenance_until'] } }).lean();
  const map = {};
  for (const d of docs) map[d.key] = d.value;
  return {
    enabled: !!map.maintenanceMode,
    message: map.maintenance_message || DEFAULT_MESSAGE,
    until: map.maintenance_until || null,
  };
}

exports.refreshMaintenanceCache = async () => {
  try {
    cache = { ...(await readMaintenanceState()), at: Date.now() };
  } catch (e) {
    cache = { enabled: false, message: DEFAULT_MESSAGE, until: null, at: Date.now() };
  }
  return cache;
};

const maintenanceHtml = (message, until) => {
  const untilText = until ? `<p class="sub">Expected to be back ${new Date(until).toLocaleString()}</p>` : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site Under Maintenance</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    font-family: "Helvetica Neue", Arial, sans-serif;
    background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
    color: #fff;
  }
  .card { text-align: center; max-width: 520px; padding: 48px 32px; }
  .wrench {
    width: 88px; height: 88px; margin: 0 auto 24px; border-radius: 50%;
    background: rgba(184,146,42,0.15); border: 1px solid rgba(184,146,42,0.4);
    display: flex; align-items: center; justify-content: center; font-size: 40px;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.06); opacity: .85; } }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: .5px; margin-bottom: 12px; }
  p { font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.75); }
  p.sub { margin-top: 10px; font-size: 13px; color: rgba(255,255,255,0.45); }
  .brand { margin-top: 28px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.3); }
</style>
</head>
<body>
  <div class="card">
    <div class="wrench">&#128736;</div>
    <h1>Under Maintenance</h1>
    <p>${String(message || DEFAULT_MESSAGE).replace(/[<>]/g, '')}</p>
    ${untilText}
    <div class="brand">The Outnet Wholesale</div>
  </div>
</body>
</html>`;
};

exports.maintenanceMiddleware = async (req, res, next) => {
  const p = req.path || '/';
  if (BYPASS_PREFIXES.some((prefix) => p.startsWith(prefix))) return next();
  if (isStaticAsset(p)) return next();

  if (Date.now() - cache.at > CACHE_TTL) {
    await exports.refreshMaintenanceCache();
  }
  if (!cache.enabled) return next();

  const isApi = p.startsWith('/main/') || p.startsWith('/home/') || p.startsWith('/api/');
  if (isApi) {
    return res.status(503).json({ code: -3, msg: cache.message });
  }

  res.status(503).setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(maintenanceHtml(cache.message, cache.until));
};
