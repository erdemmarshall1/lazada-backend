/**
 * finalize_product_images.js
 *
 * Run INSIDE the Railway environment after backend is redeployed:
 *    node scripts/finalize_product_images.js
 *
 * Scans product_photos/ directory, matches images to products by
 * keyword extraction, and updates MongoDB.
 */
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes('localhost')) {
  console.error('ERROR: MONGODB_URI is not set to a production database');
  process.exit(1);
}

const Product = require('../models/Product');
const PHOTOS_DIR = path.join(__dirname, '..', 'uploads', 'product_photos');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Helper: normalize string for comparison
function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Helper: extract meaningful keywords
function getKeywords(s) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'new', 'from', 'this', 'that', 'have', 'not',
    'are', 'was', 'but', 'all', 'can', 'has', 'its', 'our', 'you', 'your',
    'size', 'color', 'inch', 'xxx', 'xxl', 'xl', 'xs', 's', 'm', 'l',
    'black', 'white', 'red', 'blue', 'green', 'gold', 'silver', 'pink',
    'style', 'type', 'high', 'quality', 'best', 'hot', 'sale', 'new',
    'design', 'fashion', 'brand', 'genuine', 'original', 'premium',
    'leather', 'fabric', 'cotton', 'polyester', 'nylon', 'wool',
    'women', 'men', 'kids', 'girl', 'boy', 'adult',
    '1', '2', '3', '4', '5', 'free', 'shipping',
  ]);
  return normalize(s).split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
}

// Score how well an image filename matches a product name
function matchScore(productName, imageName) {
  const pWords = getKeywords(productName);
  const iWords = getKeywords(imageName);
  if (pWords.length === 0 || iWords.length === 0) return 0;

  const common = pWords.filter(w => iWords.includes(w));
  if (common.length === 0) return 0;

  const score = common.length / Math.max(pWords.length, iWords.length);
  // Bonus for matching the first keyword (usually brand)
  const firstWord = pWords[0];
  const brandBonus = iWords.includes(firstWord) ? 0.3 : 0;
  return score + brandBonus;
}

async function main() {
  console.log('=== Product Image Finalizer ===\n');

  // 1. Connect to MongoDB
  console.log('1. Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('   Connected\n');

  // 2. Scan product photos directory
  console.log('2. Scanning product photos...');
  let photoFiles = [];
  try {
    photoFiles = fs.readdirSync(PHOTOS_DIR)
      .filter(f => /\.(webp|png|jpg|jpeg|avif|jfif|gif)$/i.test(f));
  } catch (e) {
    console.log('   No product_photos directory found');
  }
  console.log('   Found ' + photoFiles.length + ' images\n');

  // 3. Get all products
  console.log('3. Fetching all products...');
  const products = await Product.find({ status: 1 });
  console.log('   Found ' + products.length + ' products\n');

  // 4. For each product, try to find a matching image
  console.log('4. Matching products to images...');
  const matched = [];
  const unmatched = [];
  const updated = [];

  for (const product of products) {
    const currentImages = product.images || [];
    const hasRealImage = Array.isArray(currentImages)
      ? currentImages.some(img => typeof img === 'string' && img.startsWith('/uploads/') && !img.includes('pixabay'))
      : typeof currentImages === 'string' && currentImages.startsWith('/uploads/') && !currentImages.includes('pixabay');

    let bestMatch = null;
    let bestScore = 0.3;

    // Try to match against each photo file
    for (const photoFile of photoFiles) {
      const photoName = path.parse(photoFile).name;
      const score = matchScore(product.name, photoName);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = photoFile;
      }
    }

    if (bestMatch) {
      // Copy the file to uploads with a UUID name
      const ext = path.extname(bestMatch);
      const newFilename = uuidv4() + ext;
      const srcPath = path.join(PHOTOS_DIR, bestMatch);
      const dstPath = path.join(UPLOADS_DIR, newFilename);

      try {
        fs.copyFileSync(srcPath, dstPath);

        // Update product with the new image
        const newImages = ['/uploads/' + newFilename];
        product.images = newImages;
        await product.save();

        updated.push({
          productId: product._id,
          name: product.name,
          image: '/uploads/' + newFilename,
          matchFile: bestMatch,
          score: bestScore,
        });
      } catch (e) {
        console.log('   Error copying ' + bestMatch + ': ' + e.message);
      }
    }
  }

  console.log('\n=== Results ===');
  console.log('Total products: ' + products.length);
  console.log('Updated: ' + updated.length);

  // Save log
  const logPath = path.join(__dirname, '..', '..', 'product_image_finalize_log.json');
  fs.writeFileSync(logPath, JSON.stringify(updated, null, 2));
  console.log('Log saved to ' + logPath);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
