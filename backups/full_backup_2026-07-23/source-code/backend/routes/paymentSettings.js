const express = require('express');
const router = express.Router();
const PaymentSetting = require('../models/PaymentSetting');
const { success, fail } = require('../utils/response');

const DEFAULTS = [
  { method: 'USDT_TRC20', label: 'USDT TRC20', walletAddress: 'TXxMu8nG3Tyokqq7td8phfjNPPEUybicyV', isActive: true, sort: 1 },
  { method: 'BTC', label: 'Bitcoin', walletAddress: '', isActive: true, sort: 2 },
  { method: 'ETH', label: 'Ethereum', walletAddress: '', isActive: true, sort: 3 },
  { method: 'Debit/Credit Card', label: 'Debit/Credit Card', walletAddress: '', isActive: true, sort: 4 },
  { method: 'ACH Transfer', label: 'ACH Transfer', walletAddress: '', isActive: true, sort: 5 },
  { method: 'Wire Transfer', label: 'Wire Transfer', walletAddress: '', isActive: true, sort: 6 },
];

// Public: get all active payment settings (auto-seeds defaults on first call)
router.get('/', async (req, res) => {
  try {
    const count = await PaymentSetting.countDocuments();
    if (count === 0) {
      await PaymentSetting.insertMany(DEFAULTS);
    }
    const list = await PaymentSetting.find({ isActive: true }).sort({ sort: 1, createdAt: -1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
});

module.exports = router;
