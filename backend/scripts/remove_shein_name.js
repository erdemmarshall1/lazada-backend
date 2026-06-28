/**
 * remove_shein_name.js
 *
 * Removes "SHEIN" prefix from all product names and "SHEIN-inspired" references from descriptions.
 *
 * Run: node scripts/remove_shein_name.js
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const API = 'https://lazada-backend-production-3b57.up.railway.app';
const USERNAME = 'admin_wholesale';
const PASSWORD = 'Admin@MQQYYI6G';

const request = (url, method, data, token) => new Promise((resolve, reject) => {
  const u = new URL(url);
  const isPost = method === 'POST';
  const body = isPost ? JSON.stringify(data) : null;
  const opts = {
    hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search,
    method,
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 30000,
  };
  if (isPost) { opts.headers['Content-Type'] = 'application/json'; opts.headers['Content-Length'] = Buffer.byteLength(body); }
  if (token) { opts.headers['Authorization'] = 'Bearer ' + token; opts.headers['token'] = token; opts.headers['x-access-token'] = token; }
  const r = https.request(opts, (res) => {
    let d = '';
    res.on('data', (c) => d += c);
    res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { resolve({ raw: d.slice(0, 500) }); } });
  });
  r.on('error', reject);
  r.on('timeout', () => { r.destroy(); reject('timeout'); });
  if (isPost) r.write(body);
  r.end();
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log('=== Remove SHEIN from product names ===\n');
  console.log('Logging in...');
  const loginRes = await request(API + '/main/sendMsg/login', 'POST', { username: USERNAME, password: PASSWORD });
  const token = loginRes?.data?.token || loginRes?.token;
  if (!token) { console.error('Login failed:', JSON.stringify(loginRes).slice(0, 200)); process.exit(1); }
  console.log('Logged in.\n');

  // Fetch all products via admin endpoint (paginated)
  console.log('Fetching all products...');
  let allProducts = [];
  let page = 1;
  const pageSize = 100;
  let total = 0;

  do {
    const res = await request(API + '/home/admin/products?page=' + page + '&pageSize=' + pageSize, 'GET', null, token);
    const data = res?.data;
    if (!data || !data.list) {
      console.log('Response:', JSON.stringify(res).slice(0, 300));
      break;
    }
    allProducts = allProducts.concat(data.list);
    total = data.total || 0;
    console.log(`  Page ${page}: got ${data.list.length} products (total: ${total})`);
    page++;
    await sleep(300);
  } while (allProducts.length < total);

  console.log(`\nTotal products fetched: ${allProducts.length}`);

  // Filter products with "SHEIN" in name or description
  const toUpdate = allProducts.filter(p => {
    const name = (p.name || '').toUpperCase();
    const desc = (p.description || '').toUpperCase();
    return name.includes('SHEIN') || desc.includes('SHEIN');
  });

  console.log(`Products containing "SHEIN": ${toUpdate.length}\n`);

  if (toUpdate.length === 0) {
    console.log('Nothing to update.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const p of toUpdate) {
    let newName = p.name || '';
    let newDesc = p.description || '';

    // Remove "SHEIN" prefix variations from name
    const namePatterns = [
      /^SHEIN\s+/i,              // "SHEIN Premium ..."
      /^SHEIN\sModa\s+/i,        // "SHEIN Moda ..."
      /^SHEIN\sEZwear\s+/i,      // "SHEIN EZwear ..."
    ];
    let nameChanged = false;
    for (const pat of namePatterns) {
      if (pat.test(newName)) {
        newName = newName.replace(pat, '');
        nameChanged = true;
        break;
      }
    }

    // Remove standalone "SHEIN" from anywhere in name
    if (!nameChanged && /\bSHEIN\b/i.test(newName)) {
      newName = newName.replace(/\bSHEIN\b\s*/gi, '').trim();
      nameChanged = true;
    }

    // Clean up double spaces and leading/trailing
    newName = newName.replace(/\s{2,}/g, ' ').trim();

    // Remove SHEIN references from description
    const descChanged = newDesc !== newDesc
      .replace(/Shein-inspired/gi, 'Premium')
      .replace(/SHEIN-inspired/gi, 'Premium')
      .replace(/—\s*Shein[^—.]*\./gi, '.')
      .replace(/—\s*SHEIN[^—.]*\./gi, '.')
      .replace(/\bSHEIN\b\s*/gi, '')
      .replace(/\bshein\b\s*/gi, '');

    newDesc = newDesc
      .replace(/Shein-inspired/gi, 'Premium')
      .replace(/SHEIN-inspired/gi, 'Premium')
      .replace(/—\s*Shein[^—.]*\./gi, '.')
      .replace(/—\s*SHEIN[^—.]*\./gi, '.')
      .replace(/\bSHEIN\b\s*/gi, '')
      .replace(/\bshein\b\s*/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (newName === (p.name || '') && newDesc === (p.description || '')) {
      skipped++;
      continue;
    }

    // Update via API
    const updatePayload = { id: p._id };
    if (newName !== (p.name || '')) updatePayload.name = newName;
    if (newDesc !== (p.description || '')) updatePayload.description = newDesc;

    const updateRes = await request(API + '/home/admin/update-product', 'POST', updatePayload, token);
    if (updateRes?.code === 0 || updateRes?.success !== false) {
      updated++;
      if (updated <= 5 || updated % 10 === 0) {
        console.log(`  ✓ Updated #${updated}: "${p.name.slice(0, 50)}..." → "${newName.slice(0, 50)}..."`);
      }
    } else {
      console.log(`  ✗ Failed: ${p.name.slice(0, 50)} — ${JSON.stringify(updateRes).slice(0, 100)}`);
    }

    await sleep(200);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no change needed): ${skipped}`);
  console.log(`Total SHEIN references processed: ${toUpdate.length}`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
