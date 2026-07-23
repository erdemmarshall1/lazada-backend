const cron = require('node-cron');
const Order = require('../models/Order');
const Shop = require('../models/Shop');

const CLOSURE_HOURS = 24;

const autoCloseViolators = async () => {
  try {
    const cutoff = new Date(Date.now() - CLOSURE_HOURS * 60 * 60 * 1000);

    const overdueOrders = await Order.find({
      status: 1,
      paymentTime: { $lte: cutoff },
    }).populate('shopId');

    const shopIds = [...new Set(overdueOrders.map(o => o.shopId?._id?.toString()).filter(Boolean))];

    if (shopIds.length === 0) return;

    await Shop.updateMany(
      { _id: { $in: shopIds }, status: { $ne: 3 } },
      {
        $set: {
          status: 3,
          closedAt: new Date(),
          closedReason: `Auto-closed: order not shipped within ${CLOSURE_HOURS} hours of payment`,
        },
      }
    );

    console.log(`Auto-closed ${shopIds.length} store(s) for shipping violations`);
  } catch (error) {
    console.error('Auto-closure error:', error.message);
  }
};

exports.start = () => {
  cron.schedule('0 * * * *', () => {
    console.log('Running auto-closure check...');
    autoCloseViolators();
  });
  console.log(`Store auto-closure scheduled every hour (${CLOSURE_HOURS}-hour violation window)`);
};
