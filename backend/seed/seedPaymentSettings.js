const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const PaymentSetting = require('../models/PaymentSetting');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existing = await PaymentSetting.countDocuments();
    if (existing > 0) {
      // Merge: only add missing methods
      for (const item of [
        { method: 'USDT_TRC20', label: 'USDT TRC20', walletAddress: 'TXxMu8nG3Tyokqq7td8phfjNPPEUybicyV', isActive: true, sort: 1 },
        { method: 'BTC', label: 'Bitcoin', walletAddress: '', isActive: true, sort: 2 },
        { method: 'ETH', label: 'Ethereum', walletAddress: '', isActive: true, sort: 3 },
        { method: 'Debit/Credit Card', label: 'Debit/Credit Card', walletAddress: '', isActive: true, sort: 4 },
        { method: 'ACH Transfer', label: 'ACH Transfer', walletAddress: '', isActive: true, sort: 5 },
        { method: 'Wire Transfer', label: 'Wire Transfer', walletAddress: '', isActive: true, sort: 6 },
      ]) {
        const exists = await PaymentSetting.findOne({ method: item.method });
        if (!exists) {
          await PaymentSetting.create(item);
          console.log(`  Created: ${item.method}`);
        } else {
          console.log(`  Skipped (exists): ${item.method}`);
        }
      }
    } else {
      await PaymentSetting.create([
        { method: 'USDT_TRC20', label: 'USDT TRC20', walletAddress: 'TXxMu8nG3Tyokqq7td8phfjNPPEUybicyV', isActive: true, sort: 1 },
        { method: 'BTC', label: 'Bitcoin', walletAddress: '', isActive: true, sort: 2 },
        { method: 'ETH', label: 'Ethereum', walletAddress: '', isActive: true, sort: 3 },
        { method: 'Debit/Credit Card', label: 'Debit/Credit Card', walletAddress: '', isActive: true, sort: 4 },
        { method: 'ACH Transfer', label: 'ACH Transfer', walletAddress: '', isActive: true, sort: 5 },
        { method: 'Wire Transfer', label: 'Wire Transfer', walletAddress: '', isActive: true, sort: 6 },
      ]);
    }

    console.log('Payment settings seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
