const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Product = require('../models/Product');

const MULTIPLIER = 1.8;

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const products = await Product.find({});
  let count = 0;

  for (const product of products) {
    let modified = false;

    if (product.minPrice) {
      product.minPrice = Math.round(product.minPrice * MULTIPLIER * 100) / 100;
      modified = true;
    }
    if (product.maxPrice) {
      product.maxPrice = Math.round(product.maxPrice * MULTIPLIER * 100) / 100;
      modified = true;
    }
    if (product.originalPrice) {
      product.originalPrice = Math.round(product.originalPrice * MULTIPLIER * 100) / 100;
      modified = true;
    }

    if (product.skus && product.skus.length > 0) {
      for (const sku of product.skus) {
        if (sku.price) {
          sku.price = Math.round(sku.price * MULTIPLIER * 100) / 100;
          modified = true;
        }
        if (sku.originalPrice) {
          sku.originalPrice = Math.round(sku.originalPrice * MULTIPLIER * 100) / 100;
          modified = true;
        }
      }
    }

    if (modified) {
      await product.save();
      count++;
    }
  }

  console.log(`Updated ${count} / ${products.length} products with ${MULTIPLIER}x price increase`);
  await mongoose.disconnect();
};

run().catch(err => { console.error(err); process.exit(1); });
