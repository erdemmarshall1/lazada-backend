const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const ROOT = path.resolve(__dirname, '..', '..');
const BACKUP_DIR = path.join(ROOT, `Lazada_Full_Backup_${new Date().toISOString().slice(0,10)}`);

const getJSON = (url, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'GET',
    headers: { 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' }, timeout: 30000 };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } }); }); req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); }); req.end();
});

const postJSON = (url, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url); const body = JSON.stringify(data);
  const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'script/1.0', token: token || '', Authorization: token ? `Bearer ${token}` : '', 'x-access-token': token || '' }, timeout: 30000 };
  const req = https.request(opts, (res) => { let d = ''; res.on('data', (c) => d += c); res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } }); }); req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); }); req.write(body); req.end();
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function exportLiveData() {
  console.log('\n=== Exporting live data from Railway API ===');
  const loginRes = await postJSON(`${API}/main/sendMsg/login`, { username: USERNAME, password: PASSWORD });
  if (loginRes.code !== 0) { console.error('Login failed:', loginRes.msg); return; }
  const token = loginRes.data?.token || loginRes.token;
  console.log('Login OK');

  const exports = {};

  // Products
  console.log('Exporting products...');
  const prodRes = await getJSON(`${API}/main/goods/getSearchList?pageSize=500&page=1`, token);
  exports.products = prodRes.data?.list || [];
  console.log(`  ${exports.products.length} products exported`);

  // Banners
  console.log('Exporting banners...');
  const banRes = await getJSON(`${API}/main/banner/getList`, token);
  exports.banners = Array.isArray(banRes.data) ? banRes.data : banRes.data?.list || [];
  console.log(`  ${exports.banners.length} banners exported`);

  // Categories
  console.log('Exporting categories...');
  const catRes = await getJSON(`${API}/main/goodsCategory/getCategory?pageSize=200&page=1`, token);
  exports.categories = catRes.data?.list || catRes.data || [];
  console.log(`  ${exports.categories.length} categories exported`);

  // Shops
  console.log('Exporting shops...');
  const shopRes = await postJSON(`${API}/main/sendMsg/getSearchList`, { pageSize: 200, page: 1 }, token);
  exports.shops = shopRes.data?.list || [];
  console.log(`  ${exports.shops.length} shops exported`);

  await sleep(1000);

  // Orders
  console.log('Exporting orders...');
  try {
    const ordRes = await postJSON(`${API}/main/sendMsg/getOrderList`, { pageSize: 200, page: 1, type: 0 }, token);
    exports.orders = ordRes.data?.list || [];
    console.log(`  ${exports.orders.length} orders exported`);
  } catch (e) { console.log('  Orders export failed:', e.message); }

  const dataDir = path.join(BACKUP_DIR, 'database');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'live_data_export.json'), JSON.stringify(exports, null, 2));
  console.log('Live data saved to database/live_data_export.json');
}

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) { console.log(`  SKIP (not found): ${src}`); return; }
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, exclude);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function writeFile(dir, name, content) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), content);
}

async function main() {
  const start = Date.now();
  console.log(`Creating full backup in: ${BACKUP_DIR}`);

  // Create backup directory
  if (fs.existsSync(BACKUP_DIR)) {
    console.log('Backup directory already exists, removing...');
    fs.rmSync(BACKUP_DIR, { recursive: true });
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // 1. Export live database data
  try { await exportLiveData(); } catch (e) { console.error('Live data export failed:', e.message); }

  // 2. Backend source code (exclude node_modules, .git, .env)
  console.log('\n=== Backend source code ===');
  const backendDest = path.join(BACKUP_DIR, 'source-code', 'backend');
  copyDir(path.join(ROOT, 'backend'), backendDest, ['node_modules', '.git']);
  console.log('  Backend copied');

  // 3. Backend .env (credentials)
  const envPath = path.join(ROOT, 'backend', '.env');
  if (fs.existsSync(envPath)) {
    const configDir = path.join(BACKUP_DIR, 'config');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.copyFileSync(envPath, path.join(configDir, 'backend.env'));
    console.log('  .env copied to config/');
  }

  // 4. Frontend source code (exclude node_modules, dist)
  console.log('\n=== Frontend source code ===');
  const frontendDest = path.join(BACKUP_DIR, 'source-code', 'frontend');
  copyDir(path.join(ROOT, 'frontend'), frontendDest, ['node_modules', 'dist']);
  console.log('  Frontend copied');

  // 5. Frontend .env files
  for (const f of ['.env', '.env.production']) {
    const fp = path.join(ROOT, 'frontend', f);
    if (fs.existsSync(fp)) {
      const configDir = path.join(BACKUP_DIR, 'config');
      fs.copyFileSync(fp, path.join(configDir, `frontend_${f}`));
    }
  }

  // 6. Uploaded files
  console.log('\n=== Uploaded files ===');
  const uploadsDest = path.join(BACKUP_DIR, 'uploads');
  copyDir(path.join(ROOT, 'backend', 'uploads'), uploadsDest);
  const upCount = fs.readdirSync(uploadsDest).length;
  console.log(`  ${upCount} files copied`);

  // 7. Frontend dist (built production)
  console.log('\n=== Frontend build ===');
  const distSrc = path.join(ROOT, 'frontend', 'dist');
  if (fs.existsSync(distSrc)) {
    const distDest = path.join(BACKUP_DIR, 'frontend-build', 'dist');
    copyDir(distSrc, distDest);
    console.log('  dist/ copied');
  } else {
    console.log('  No dist/ found');
  }

  // 8. Deployment configs
  console.log('\n=== Deployment configs ===');
  const deployDir = path.join(BACKUP_DIR, 'deployment');
  if (!fs.existsSync(deployDir)) fs.mkdirSync(deployDir, { recursive: true });
  for (const f of ['Dockerfile', '.dockerignore', 'render.yaml']) {
    const fp = path.join(ROOT, 'backend', f);
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(deployDir, f));
  }
  const nf = path.join(ROOT, 'frontend', 'netlify.toml');
  if (fs.existsSync(nf)) fs.copyFileSync(nf, path.join(deployDir, 'netlify.toml'));
  const vc = path.join(ROOT, 'frontend', 'vite.config.js');
  if (fs.existsSync(vc)) fs.copyFileSync(vc, path.join(deployDir, 'vite.config.js'));
  console.log('  Deployment configs copied');

  // 9. Data files (JSON exports, scripts)
  console.log('\n=== Data files ===');
  const dataDir = path.join(BACKUP_DIR, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const dataFiles = ['products_with_images.json', 'extracted_products.json', 'product_image_updates.json', 'cdn_urls.json', 'products.txt', 'products_list.txt', 'unique_products.txt'];
  for (const f of dataFiles) {
    const fp = path.join(ROOT, f);
    if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(dataDir, f));
  }
  console.log('  Data files copied');

  // 10. Write backup manifest
  console.log('\n=== Writing backup manifest ===');
  const manifest = {
    date: new Date().toISOString(),
    source: ROOT,
    exportedFrom: API,
    contents: [
      'source-code/backend/        - Full backend (no node_modules)',
      'source-code/frontend/       - Full frontend (no node_modules)',
      'config/                     - .env files, deployment configs',
      'uploads/                    - Uploaded images (~194 files)',
      'frontend-build/dist/        - Production Vue build',
      'deployment/                 - Dockerfile, netlify.toml, vite.config.js',
      'data/                       - JSON exports, product data files',
      'database/live_data_export.json - Live API data snapshot',
      'scripts/                    - All backend scripts',
      'README.md                   - Restore instructions',
    ],
    notes: [
      'MongoDB not available locally - no mongodump possible.',
      'Live data export includes products/banners/categories/shops/orders from Railway.',
      'Run "npm install && npm run seed" in backend/ to recreate seed data.',
      'Run "npm install && npm run build" in frontend/ to rebuild.',
    ],
  };
  writeFile(BACKUP_DIR, 'backup_manifest.json', JSON.stringify(manifest, null, 2));
  console.log('  backup_manifest.json written');

  // 11. Write restore instructions
  const readme = `# Lazada Full Website Backup
Generated: ${new Date().toISOString()}

## Restore Instructions

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Restore Backend
\`\`\`bash
cd source-code/backend
npm install
# Copy config/backend.env to .env (edit MongoDB URI as needed)
npm run seed   # Recreates seed data
npm start      # Starts on port 3000
\`\`\`

### 2. Restore Frontend
\`\`\`bash
cd source-code/frontend
npm install
# Edit config/frontend_.env if API URL changed
npm run build  # Builds to dist/
npm run dev    # Dev server on port 5174
\`\`\`

### 3. Database
- Seed data is recreated via \`npm run seed\`
- Live API snapshot in \`database/live_data_export.json\`
- Uploaded images in \`uploads/\` - copy to \`backend/uploads/\`

### 4. Deploy
- Backend: Use \`deployment/Dockerfile\` or \`deployment/render.yaml\`
- Frontend: Deploy \`frontend-build/dist/\` to Netlify via \`deployment/netlify.toml\`
`;
  writeFile(BACKUP_DIR, 'README.md', readme);
  console.log('  README.md written');

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const size = getDirSize(BACKUP_DIR);
  console.log(`\n=== Backup complete (${elapsed}s, ${(size / 1024 / 1024).toFixed(1)} MB) ===`);
  console.log(`Backup location: ${BACKUP_DIR}`);
}

function getDirSize(dir) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) size += getDirSize(p);
      else size += fs.statSync(p).size;
    }
  } catch (e) {}
  return size;
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
