const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'scraped_details.json');
const outDir = path.join(__dirname, 'chunks');
const CHUNK_SIZE = 2700;

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const raw = fs.readFileSync(src, 'utf8');
const all = JSON.parse(raw);
console.log(`Loaded ${all.length} products`);

let chunkNum = 0;
for (let i = 0; i < all.length; i += CHUNK_SIZE) {
  const chunk = all.slice(i, Math.min(i + CHUNK_SIZE, all.length));
  const name = `scraped_chunk_${chunkNum}.json`;
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(chunk));
  console.log(`Wrote ${name} (${chunk.length} products)`);
  chunkNum++;
}
console.log(`Done: ${chunkNum} chunks`);
