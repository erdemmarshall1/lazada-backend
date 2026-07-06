const fs = require('fs');
const path = require('path');

const INDEX = path.join(__dirname, '..', '..', 'local_assets', 'image_database.json');
const ALL_IMAGES = path.join(__dirname, '..', '..', 'local_assets', 'all_images');
const UPLOADS = path.join(__dirname, '..', 'uploads');

const idx = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
let copied = 0, skipped = 0, errors = 0;

for (const entry of idx.entries) {
  const localFile = entry.imageFile;
  const remoteName = path.basename(entry.remotePath);
  const src = path.join(ALL_IMAGES, localFile);
  const dst = path.join(UPLOADS, remoteName);

  if (!fs.existsSync(src)) {
    console.error(`  MISSING: ${localFile} (${entry.name.substring(0, 40)})`);
    errors++;
    continue;
  }

  if (fs.existsSync(dst)) {
    const srcSize = fs.statSync(src).size;
    const dstSize = fs.statSync(dst).size;
    if (srcSize === dstSize) {
      skipped++;
      continue;
    }
  }

  fs.copyFileSync(src, dst);
  copied++;
}

const total = idx.entries.length;
console.log(`\nTotal entries: ${total}`);
console.log(`Copied: ${copied}`);
console.log(`Skipped (exists): ${skipped}`);
console.log(`Errors: ${errors}`);
