const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Wallet = require('../models/Wallet');
const PlatformWallet = require('../models/PlatformWallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const emailService = require('../services/emailService');
const { success, fail, paginate } = require('../utils/response');
const { generateOrderNo } = require('../utils/helpers');

const getIo = (req) => req.app.get('io')

const emitToShop = (req, shopId, event, data) => {
  const io = getIo(req)
  if (io) io.to(`shop_${shopId}`).emit(event, data)
}

const emitToAll = (req, event, data) => {
  const io = getIo(req)
  if (io) io.to('all').emit(event, data)
}

const emitToUser = (req, userId, event, data) => {
  const io = getIo(req)
  if (io) io.to(`user_${userId}`).emit(event, data)
}

exports.add = async (req, res) => {
  try {
    const { items, shippingAddress, buyerMessage, couponCode } = req.body;
    if (!items || items.length === 0) return res.json(fail('No items'));

    const orderItems = [];
    let shopId = null;
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.json(fail(`Product ${item.productId} not found`));
      const sku = product.skus.id(item.skuId);
      if (!sku) return res.json(fail('SKU not found'));
      if (sku.stock < item.quantity) return res.json(fail(`Insufficient stock for ${product.name}`));
      shopId = product.shopId;
      const subtotal = sku.price * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        productId: product._id, skuId: sku._id, productName: product.name,
        productImage: product.images[0] || '', skuAttrs: sku.attrs,
        price: sku.price, quantity: item.quantity, subtotal,
      });
    }

    let discount = 0;
    let appliedCoupon = '';
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.status === 1) {
        if (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) {
          if (!coupon.maxUses || coupon.usedCount < coupon.maxUses) {
            if (totalAmount >= coupon.minOrderAmount) {
              if (coupon.type === 'fixed') {
                discount = Math.min(coupon.value, totalAmount);
              } else {
                discount = Math.round(totalAmount * (coupon.value / 100) * 100) / 100;
                if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                  discount = coupon.maxDiscount;
                }
              }
              appliedCoupon = coupon.code;
              coupon.usedCount += 1;
              await coupon.save();
            }
          }
        }
      }
    }

    const order = await Order.create({
      orderNo: generateOrderNo(), userId: req.user._id, shopId,
      items: orderItems, totalAmount, discount, couponCode: appliedCoupon,
      finalAmount: Math.max(0, totalAmount - discount),
      shippingAddress, buyerMessage, status: 0,
    });

    for (const item of items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, 'skus._id': item.skuId },
        { $inc: { 'skus.$.stock': -item.quantity, salesCount: item.quantity } }
      );
    }

    const populated = await Order.findById(order._id).populate('userId', 'username')
    emitToShop(req, shopId, 'newOrder', { order: populated, message: `New order ${order.orderNo}` })
    emitToAll(req, 'newOrder', { order: populated, message: `New order ${order.orderNo}` })

    const { createNotification } = require('./notificationController');
    const adminUsers = await User.find({ role: { $in: ['admin', 'super_admin'] } }).select('_id').lean();
    await Promise.all(adminUsers.map(a =>
      createNotification(a._id, 'order', 'New Order', `Order ${order.orderNo} for $${order.finalAmount}`,
        { orderId: order._id }, '/admin/transactions')
    ));
    if (order.shopId) {
      const shop = await Shop.findById(order.shopId).select('userId').lean();
      if (shop) {
        createNotification(shop.userId, 'order', 'New Order', `New order ${order.orderNo} received`,
          { orderId: order._id }, '/storeordercontrol');
      }
    }

    const user = await User.findById(req.user._id);
    if (user?.email) emailService.sendOrderConfirmation(user, order).catch(() => {});

    res.json(success(order, 'Order created'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.pay = async (req, res) => {
  try {
    const { orderId, fundPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    if (!user.fundPassword) return res.json(fail('Please set a transaction password first'));
    const isMatch = await user.matchFundPassword(fundPassword);
    if (!isMatch) return res.json(fail('Invalid transaction password'));
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.status !== 0) return res.json(fail('Order cannot be paid'));

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < order.finalAmount) {
      return res.json(fail('Insufficient balance'));
    }

    wallet.balance -= order.finalAmount;
    wallet.totalSpent += order.finalAmount;
    await wallet.save();

    await PlatformWallet.findOneAndUpdate(
      {}, { $inc: { escrowBalance: order.finalAmount } }, { upsert: true }
    );

    order.status = 1;
    order.paymentTime = new Date();
    await order.save();

    await Transaction.create({
      userId: req.user._id, type: 'payment', amount: -order.finalAmount,
      balanceBefore: wallet.balance + order.finalAmount, balanceAfter: wallet.balance,
      orderId: order._id, description: `Payment for order ${order.orderNo}`,
    });

    const populated = await Order.findById(order._id).populate('userId', 'username')
    emitToShop(req, order.shopId, 'orderPaid', { order: populated, message: `Order ${order.orderNo} paid` })

    if (user?.email) emailService.sendPaymentConfirmation(user, order).catch(() => {});

    res.json(success(order, 'Payment successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.payCart = async (req, res) => {
  try {
    const { orderIds, fundPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    if (!user.fundPassword) return res.json(fail('Please set a transaction password first'));
    const isMatch = await user.matchFundPassword(fundPassword);
    if (!isMatch) return res.json(fail('Invalid transaction password'));
    const ids = orderIds.split(',');
    let totalAmount = 0;
    for (const id of ids) {
      const order = await Order.findById(id);
      if (order && order.status === 0) {
        totalAmount += order.finalAmount;
      }
    }
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < totalAmount) {
      return res.json(fail('Insufficient balance'));
    }
    wallet.balance -= totalAmount;
    wallet.totalSpent += totalAmount;
    await wallet.save();

    await PlatformWallet.findOneAndUpdate(
      {}, { $inc: { escrowBalance: totalAmount } }, { upsert: true }
    );

    for (const id of ids) {
      const order = await Order.findById(id);
      if (order && order.status === 0) {
        order.status = 1;
        order.paymentTime = new Date();
        await order.save();
      }
    }

    await Transaction.create({
      userId: req.user._id, type: 'payment', amount: -totalAmount,
      balanceBefore: wallet.balance + totalAmount, balanceAfter: wallet.balance,
      description: `Payment for multiple orders`,
    });

    if (user?.email) {
      for (const id of ids) {
        const order = await Order.findById(id);
        if (order) emailService.sendPaymentConfirmation(user, order).catch(() => {});
      }
    }

    res.json(success(null, 'Payment successful'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInfo = async (req, res) => {
  try {
    const order = await Order.findById(req.query.id).populate('shopId', 'name');
    if (!order) return res.json(fail('Order not found'));
    res.json(success(order));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getList = async (req, res) => {
  try {
    const { status, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { userId: req.user._id };
    if (status !== undefined && status !== '' && status !== '-1') {
      query.status = parseInt(status);
    }
    const [list, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('shopId', 'name'),
      Order.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.cancel = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.status !== 0) return res.json(fail('Order cannot be canceled'));
    order.status = 6;
    await order.save();
    for (const item of order.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, 'skus._id': item.skuId },
        { $inc: { 'skus.$.stock': item.quantity, salesCount: -item.quantity } }
      );
    }
    emitToShop(req, order.shopId, 'orderCancelled', { order, message: `Order ${order.orderNo} cancelled` })
    res.json(success(order, 'Order canceled'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.confirmArrival = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.status !== 2) return res.json(fail('Order cannot be confirmed'));

    const shop = await Shop.findById(order.shopId);
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
      balanceBefore: sellerWallet.balance - order.finalAmount, balanceAfter: sellerWallet.balance,
      orderId: order._id, description: `Payout for order ${order.orderNo}`,
    });

    order.status = 3;
    order.confirmTime = new Date();
    await order.save();
    emitToShop(req, order.shopId, 'orderCompleted', { order, message: `Order ${order.orderNo} completed` })
    res.json(success(order, 'Arrival confirmed'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.refund = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.status > 1) return res.json(fail('Order cannot be refunded'));
    order.refundStatus = 1;
    order.refundReason = reason;
    order.refundAmount = order.finalAmount;
    await order.save();
    emitToShop(req, order.shopId, 'refundRequested', { order, message: `Refund requested for order ${order.orderNo}` })
    emitToAll(req, 'refundRequested', { order, message: `Refund requested for order ${order.orderNo}` })
    res.json(success(order, 'Refund requested'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getExpressInfo = async (req, res) => {
  res.json(success({ trackingNo: 'SF1234567890', company: 'SF Express', status: 'in_transit' }));
};

exports.editOrderAddress = async (req, res) => {
  try {
    const { orderId, address } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    order.shippingAddress = address;
    await order.save();
    res.json(success(order, 'Address updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getCartList = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    res.json(success(cart));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.addCart = async (req, res) => {
  try {
    const { productId, skuId, quantity, price } = req.body;
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    const existing = cart.items.find(i => i.productId.toString() === productId && i.skuId.toString() === skuId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, skuId, quantity, price });
    }
    await cart.save();
    res.json(success(cart, 'Added to cart'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.editCart = async (req, res) => {
  try {
    const { productId, skuId, quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json(fail('Cart not found'));
    const item = cart.items.find(i => i.productId.toString() === productId && i.skuId.toString() === skuId);
    if (item) item.quantity = quantity;
    await cart.save();
    res.json(success(cart, 'Cart updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.delCart = async (req, res) => {
  try {
    const { productId, skuId } = req.body;
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.json(fail('Cart not found'));
    cart.items = cart.items.filter(i => !(i.productId.toString() === productId && i.skuId.toString() === skuId));
    await cart.save();
    res.json(success(cart, 'Removed from cart'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getShopOrderList = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    const { status, refundStatus, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { shopId: shop._id };
    if (status !== undefined && status !== '' && status !== '-1') {
      query.status = parseInt(status);
    }
    if (refundStatus !== undefined && refundStatus !== '') {
      query.refundStatus = parseInt(refundStatus);
    }
    const [list, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('userId', 'username'),
      Order.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.ship = async (req, res) => {
  try {
    const { orderId, trackingNo } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('Shop not found'));
    if (shop.status === 3) return res.json(fail('Your store has been closed, kindly contact the customer support'));
    const order = await Order.findOne({ _id: orderId, shopId: shop._id });
    if (!order) return res.json(fail('Order not found'));

    let totalCost = 0;
    const costItems = [];
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const sku = product.skus.id(item.skuId);
        const cost = sku?.cost || 0;
        totalCost += cost * item.quantity;
        costItems.push({ productId: item.productId, name: item.productName, cost, quantity: item.quantity });
      }
    }

    if (totalCost > 0) {
      const sellerWallet = await Wallet.findOne({ userId: req.user._id });
      if (!sellerWallet || sellerWallet.balance < totalCost) {
        return res.json(fail(`Insufficient balance to ship. Need $${totalCost.toFixed(2)}, have $${(sellerWallet?.balance || 0).toFixed(2)}`));
      }
      sellerWallet.balance -= totalCost;
      sellerWallet.totalSpent = (sellerWallet.totalSpent || 0) + totalCost;
      await sellerWallet.save();

      await PlatformWallet.findOneAndUpdate(
        {}, { $inc: { balance: totalCost } }, { upsert: true }
      );

      await Transaction.create({
        userId: req.user._id,
        type: 'wholesale_purchase',
        amount: -totalCost,
        balanceBefore: sellerWallet.balance + totalCost,
        balanceAfter: sellerWallet.balance,
        orderId: order._id,
        description: `Wholesale cost for order ${order.orderNo}`,
      });
    }

    order.status = 2;
    order.trackingNo = trackingNo || '';
    order.shippingTime = new Date();
    await order.save();
    emitToUser(req, order.userId, 'orderShipped', { order, message: `Order ${order.orderNo} has been shipped` })
    const buyer = await User.findById(order.userId);
    if (buyer?.email) emailService.sendShippingUpdate(buyer, order).catch(() => {});
    res.json(success(order, 'Shipped'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.agreeRefund = async (req, res) => {
  try {
    const { orderId } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    const order = await Order.findOne({ _id: orderId, shopId: shop._id });
    if (!order) return res.json(fail('Order not found'));
    if (order.status >= 1) {
      await PlatformWallet.findOneAndUpdate(
        {}, { $inc: { escrowBalance: -order.finalAmount } }
      );
    }
    const wallet = await Wallet.findOne({ userId: order.userId });
    if (wallet) {
      wallet.balance += order.finalAmount;
      await wallet.save();
      await Transaction.create({
        userId: order.userId, type: 'refund', amount: order.finalAmount,
        balanceBefore: wallet.balance - order.finalAmount, balanceAfter: wallet.balance,
        orderId: order._id, description: `Refund for order ${order.orderNo}`,
      });
    }
    order.refundStatus = 2;
    order.status = 6;
    await order.save();
    emitToUser(req, order.userId, 'refundProcessed', { order, message: `Refund approved for order ${order.orderNo}` })
    const buyer = await User.findById(order.userId);
    if (buyer?.email) emailService.sendRefundNotification(buyer, order).catch(() => {});
    res.json(success(order, 'Refund approved'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.rejectRefund = async (req, res) => {
  try {
    const { orderId } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    const order = await Order.findOne({ _id: orderId, shopId: shop._id });
    if (!order) return res.json(fail('Order not found'));
    order.refundStatus = 3;
    await order.save();
    emitToUser(req, order.userId, 'refundProcessed', { order, message: `Refund rejected for order ${order.orderNo}` })
    res.json(success(order, 'Refund rejected'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
