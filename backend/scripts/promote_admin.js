/**
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
    { email: 'admin_wholesale@shopify.com' },
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
