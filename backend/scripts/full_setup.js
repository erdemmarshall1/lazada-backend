/**
 * full_setup.js
 *
 * 1. Register a new admin account on Railway
 * 2. Output the credentials
 * 3. Generate promote_admin.js for step 2
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const EMAIL = 'admin_wholesale@shopify.com';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@' + Date.now().toString(36).toUpperCase();

const postJSON = (url, data) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const body = JSON.stringify(data);
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'User-Agent': 'setup/1.0' },
    timeout: 30000,
  };
  const req = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(new Error(d.slice(0,200))); } });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  req.write(body);
  req.end();
});

const main = async () => {
  console.log('═'.repeat(50));
  console.log('Full Setup — Step 1 of 3');
  console.log('═'.repeat(50));

  // 1. Register
  console.log(`\nRegistering admin account...`);
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Username: ${USERNAME}`);
  console.log(`  Password: ${PASSWORD}`);

  const regRes = await postJSON(`${API}/main/sendMsg/reg`, {
    username: USERNAME,
    email: EMAIL,
    password: PASSWORD,
    phone: '1234567890',
  });

  if (regRes.code !== 0) {
    if (regRes.msg && regRes.msg.includes('duplicate')) {
      console.log('  (Account may already exist — continuing)');
    } else {
      console.error('  Registration failed:', regRes.msg || 'Unknown error');
      process.exit(1);
    }
  } else {
    console.log('  Registration OK');
  }

  // 2. Generate promote_admin.js
  const promoteScript = `/**
 * promote_admin.js — Run via: railway run node scripts/promote_admin.js
 * Promotes the admin_wholesale user to admin role.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_wholesale';

mongoose.connect(MONGODB_URI).then(async () => {
  const User = require('../models/User');
  const r = await User.findOneAndUpdate(
    { email: '${EMAIL}' },
    { role: 'admin' },
    { new: true }
  );
  if (r) {
    console.log('✓ User promoted to admin:', r.username, '(' + r.role + ')');
  } else {
    console.log('✗ User not found');
  }
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('MongoDB error:', err.message);
  process.exit(1);
});
`;
  const promotePath = path.join(__dirname, 'promote_admin.js');
  fs.writeFileSync(promotePath, promoteScript);
  console.log(`\nCreated: ${promotePath}`);

  // 3. Print instructions
  console.log('\n' + '═'.repeat(50));
  console.log('NEXT STEPS (copy-paste each line):');
  console.log('═'.repeat(50));
  console.log('');
  console.log('Step 2 — Promote the user to admin:');
  console.log('  cd C:\\Users\\Tron\\Downloads\\Lazada\\backend');
  console.log('  railway run node scripts/promote_admin.js');
  console.log('');
  console.log('Step 3 — Apply image updates:');
  console.log('  $env:ADMIN_PASSWORD="' + PASSWORD + '"; node scripts/apply_image_updates.js');
  console.log('');
  console.log('Admin credentials to save:');
  console.log('  Email:    ' + EMAIL);
  console.log('  Username: ' + USERNAME);
  console.log('  Password: ' + PASSWORD);
  console.log('');
};

main().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
