const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Product = require('../models/Product');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const products = await Product.find({ images: { $exists: true, $ne: [] } }).lean();
  
  let existing = 0, missing = 0, cloudinary = 0, external = 0;
  const missingDetails = [];
  const existingLocal = [];

  for (const p of products) {
    const img = p.images?.[0];
    if (!img) continue;
    if (img.startsWith('/uploads/')) {
      const filePath = path.join(UPLOADS_DIR, img.replace('/uploads/', ''));
      if (fs.existsSync(filePath)) {
        existing++;
        existingLocal.push({ id: p._id, file: img });
      } else {
        missing++;
        missingDetails.push({ id: p._id, name: p.name, file: img });
      }
    } else if (img.includes('res.cloudinary.com')) {
      cloudinary++;
    } else {
      external++;
    }
  }

  console.log('=== Local image check ===');
  console.log(`Cloudinary: ${cloudinary}`);
  console.log(`Local files EXISTING: ${existing}`);
  console.log(`Local files MISSING: ${missing}`);
  console.log(`External URLs: ${external}`);
  console.log(`\nSample of ${Math.min(20, missing)} missing:`);
  missingDetails.slice(0, 20).forEach(m => console.log(`  ${m.id} - ${m.name?.slice(0,50)} - ${m.file}`));
  console.log(`\nSample of ${Math.min(10, existing)} existing:`);
  existingLocal.slice(0, 10).forEach(m => console.log(`  ${m.id} - ${m.file}`));

  await mongoose.disconnect();
}

main().catch(console.error);
