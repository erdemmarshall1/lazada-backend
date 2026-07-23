const fs = require('fs');
const path = require('path');
const https = require('https');

const API_BASE = process.env.API_URL || 'https://lazada-backend-1.onrender.com';
const SECRET = 'reimport123';
const CHUNK_SIZE = 500;

const filePath = path.join(__dirname, 'scraped_details.json');
const raw = fs.readFileSync(filePath, 'utf8');
const all = JSON.parse(raw);
console.log(`Loaded ${all.length} products from ${filePath}`);

let chunkNum = 0;
let totalImported = 0;
let totalErrors = 0;

async function sendChunk(products) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ products });
    const url = new URL(`/api/bulk-import?secret=${SECRET}`, API_BASE);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => body += d);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch (e) { resolve({ error: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  for (let i = 0; i < all.length; i += CHUNK_SIZE) {
    const chunk = all.slice(i, Math.min(i + CHUNK_SIZE, all.length));
    chunkNum++;
    process.stdout.write(`Chunk ${chunkNum}/${Math.ceil(all.length / CHUNK_SIZE)} (${chunk.length} products)... `);
    try {
      const result = await sendChunk(chunk);
      if (result.imported !== undefined) {
        totalImported += result.imported;
        totalErrors += result.errors;
        process.stdout.write(`imported=${result.imported}, errors=${result.errors}, total=${result.total}\n`);
      } else {
        process.stdout.write(`ERROR: ${JSON.stringify(result)}\n`);
      }
    } catch (e) {
      process.stdout.write(`NETWORK ERROR: ${e.message}\n`);
    }
    // Small delay between chunks
    await new Promise(r => setTimeout(r, 500));
  }
  console.log(`\nDone! Total imported: ${totalImported}, errors: ${totalErrors}`);
}

main().catch(console.error);
