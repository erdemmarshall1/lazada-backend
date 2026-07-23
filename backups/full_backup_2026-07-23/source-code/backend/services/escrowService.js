const cron = require('node-cron');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const Wallet = require('../models/Wallet');
const PlatformWallet = require('../models/PlatformWallet');
const Transaction = require('../models/Transaction');

const AUTO_RELEASE_DAYS = 14;

const releaseEscrow = async () => {
  try {
    const cutoff = new Date(Date.now() - AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000);
    const orders = await Order.find({
      status: 2,
      shippingTime: { $lte: cutoff },
    });

    for (const order of orders) {
      const shop = await Shop.findById(order.shopId);
      if (!shop) continue;

      let sellerWallet = await Wallet.findOne({ userId: shop.userId });
      if (!sellerWallet) {
        sellerWallet = await Wallet.create({ userId: shop.userId, balance: 0 });
      }

      sellerWallet.balance += order.finalAmount;
      sellerWallet.totalEarned += order.finalAmount;
      await sellerWallet.save();

      await PlatformWallet.findOneAndUpdate(
        {}, { $inc: { escrowBalance: -order.finalAmount, balance: order.finalAmount } }
      );

      await Transaction.create({
        userId: shop.userId, type: 'payout', amount: order.finalAmount,
        balanceBefore: sellerWallet.balance - order.finalAmount,
        balanceAfter: sellerWallet.balance,
        orderId: order._id,
        description: `Auto payout for order ${order.orderNo} (${AUTO_RELEASE_DAYS}-day escrow release)`,
      });

      order.status = 3;
      order.confirmTime = new Date();
      await order.save();

      console.log(`Escrow auto-released for order ${order.orderNo}`);
    }

    if (orders.length > 0) {
      console.log(`Auto-released escrow for ${orders.length} orders`);
    }
  } catch (error) {
    console.error('Escrow auto-release error:', error.message);
  }
};

exports.start = () => {
  cron.schedule('0 */6 * * *', () => {
    console.log('Running escrow auto-release check...');
    releaseEscrow();
  });
  console.log(`Escrow auto-release scheduled every 6 hours (${AUTO_RELEASE_DAYS}-day release)`);
};
