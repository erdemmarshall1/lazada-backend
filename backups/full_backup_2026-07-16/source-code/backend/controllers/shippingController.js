const Order = require('../models/Order');
const Product = require('../models/Product');
const Shipping = require('../models/Shipping');
const Shop = require('../models/Shop');
const Wallet = require('../models/Wallet');
const PlatformWallet = require('../models/PlatformWallet');
const Transaction = require('../models/Transaction');
const { success, fail, paginate } = require('../utils/response');

const CARRIERS = [
  { id: 'sf', name: 'SF Express' },
  { id: 'yto', name: 'YTO Express' },
  { id: 'zto', name: 'ZTO Express' },
  { id: 'sto', name: 'STO Express' },
  { id: 'yd', name: 'Yunda Express' },
  { id: 'ems', name: 'EMS' },
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'dhl', name: 'DHL' },
  { id: 'tnt', name: 'TNT' },
];

const TRACKING_STATUS = {
  0: 'Pending Pickup',
  1: 'Picked Up',
  2: 'In Transit',
  3: 'Out for Delivery',
  4: 'Delivered',
  5: 'Delivery Failed',
  6: 'Returned',
};

const genTrackingNo = (carrier) => {
  const prefix = { sf: 'SF', yto: 'YT', zto: 'ZT', sto: 'ST', yd: 'YD', ems: 'EM', ups: 'UP', fedex: 'FX', dhl: 'DH', tnt: 'TN' };
  const p = prefix[carrier] || 'LG';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${p}${ts}${rand}`;
};

const create = async (req, res) => {
  try {
    let { orderId, carrier, trackingNo, packageWeight, packageLength, packageWidth, packageHeight, notes } = req.body;
    if (!orderId) return res.json(fail('Order ID is required'));
    if (!carrier) {
      carrier = CARRIERS[Math.floor(Math.random() * CARRIERS.length)].id;
    }

    const order = await Order.findById(orderId).populate('userId', 'name phone');
    if (!order) return res.json(fail('Order not found'));

    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('Shop not found'));
    if (order.shopId.toString() !== shop._id.toString()) return res.json(fail('Unauthorized'));

    const existing = await Shipping.findOne({ orderId });
    if (existing) return res.json(fail('Order already shipped'));

    const { shippingCost: rawShippingCost } = req.body;
    const shippingCost = Math.max(0, parseFloat(rawShippingCost) || 0);

    let totalCost = 0;
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        const sku = product.skus.id(item.skuId);
        const cost = sku?.cost || item.price || 0;
        totalCost += cost * item.quantity;
      }
    }

    const totalDeduction = totalCost + shippingCost;

    if (totalDeduction > 0) {
      let sellerWallet = await Wallet.findOne({ userId: req.user._id });
      if (!sellerWallet) {
        sellerWallet = await Wallet.create({ userId: req.user._id, balance: 0 });
      }
      if (sellerWallet.balance < totalDeduction) {
        return res.json({
          code: -2,
          msg: `Insufficient balance. Need $${totalDeduction.toFixed(2)}, have $${sellerWallet.balance.toFixed(2)}`,
          data: { required: totalDeduction, balance: sellerWallet.balance, shortfall: totalDeduction - sellerWallet.balance }
        });
      }
      sellerWallet.balance -= totalDeduction;
      sellerWallet.totalSpent = (sellerWallet.totalSpent || 0) + totalDeduction;
      await sellerWallet.save();

      await PlatformWallet.findOneAndUpdate(
        {}, { $inc: { balance: totalDeduction } }, { upsert: true }
      );

      const descParts = [];
      if (totalCost > 0) descParts.push(`wholesale cost $${totalCost.toFixed(2)}`);
      if (shippingCost > 0) descParts.push(`shipping $${shippingCost.toFixed(2)}`);
      await Transaction.create({
        userId: req.user._id, type: 'wholesale_purchase', amount: -totalDeduction,
        balanceBefore: sellerWallet.balance + totalDeduction,
        balanceAfter: sellerWallet.balance,
        orderId: order._id,
        description: `Deducted ${descParts.join(' + ')} for order ${order.orderNo}`,
      });
    }

    const finalTrackingNo = trackingNo || genTrackingNo(carrier);

    const shipping = await Shipping.create({
      orderId,
      shopId: shop._id,
      carrier,
      trackingNo: finalTrackingNo,
      status: 0,
      statusHistory: [{ status: 0, location: '', description: 'Shipping label created', timestamp: new Date() }],
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      senderName: shop.name,
      senderPhone: shop.phone,
      senderAddress: shop.address,
      receiverName: order.shippingAddress?.name || '',
      receiverPhone: order.shippingAddress?.phone || '',
      receiverAddress: [order.shippingAddress?.province, order.shippingAddress?.city, order.shippingAddress?.district, order.shippingAddress?.detail].filter(Boolean).join(', '),
      packageWeight,
      packageLength,
      packageWidth,
      packageHeight,
      notes,
    });

    order.trackingNo = finalTrackingNo;
    order.status = 2;
    order.shippingFee = shippingCost;
    order.shippingTime = new Date();
    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.userId}`).emit('orderShipped', {
        orderId: order._id,
        trackingNo: finalTrackingNo,
        message: `Your order ${order.orderNo} has been shipped via ${carrier}`,
      });
    }

    return res.json(success(shipping, 'Shipping record created'));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

const getInfo = async (req, res) => {
  try {
    const { orderId } = req.query;
    if (!orderId) return res.json(fail('Order ID is required'));

    const shipping = await Shipping.findOne({ orderId }).populate('orderId', 'orderNo status finalAmount');
    if (!shipping) return res.json(fail('Shipping record not found'));

    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));

    const isOwner = order.userId.toString() === req.user._id.toString();
    const shop = await Shop.findOne({ userId: req.user._id });
    const isSeller = shop && order.shopId.toString() === shop._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isSeller && !isAdmin) return res.json(fail('Unauthorized'));

    return res.json(success({
      ...shipping.toObject(),
      statusLabel: TRACKING_STATUS[shipping.status] || 'Unknown',
      statusHistory: shipping.statusHistory.map(h => ({
        ...h,
        statusLabel: TRACKING_STATUS[h.status] || 'Unknown',
      })),
    }));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

const updateTracking = async (req, res) => {
  try {
    const { shippingId, newStatus, location, description } = req.body;
    if (!shippingId || newStatus === undefined) return res.json(fail('Shipping ID and new status are required'));

    const shipping = await Shipping.findById(shippingId);
    if (!shipping) return res.json(fail('Shipping record not found'));

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) return res.json(fail('Admin access required'));

    shipping.statusHistory.push({
      status: newStatus,
      location: location || '',
      description: description || TRACKING_STATUS[newStatus] || 'Status updated',
      timestamp: new Date(),
    });
    shipping.status = newStatus;

    if (newStatus === 4) {
      shipping.deliveredAt = new Date();
    }

    await shipping.save();

    const order = await Order.findById(shipping.orderId);
    const io = req.app.get('io');
    if (io && order) {
      io.to(`user_${order.userId}`).emit('trackingUpdated', {
        orderId: order._id,
        trackingNo: shipping.trackingNo,
        status: newStatus,
        statusLabel: TRACKING_STATUS[newStatus] || 'Unknown',
        message: `Your order ${order.orderNo} tracking updated: ${TRACKING_STATUS[newStatus] || 'Status updated'}`,
      });
    }

    return res.json(success(shipping, 'Tracking updated'));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

const list = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop && req.user.role !== 'admin') return res.json(fail('Shop not found'));

    const filter = {};
    if (req.user.role === 'admin') {
      if (req.query.shopId) filter.shopId = req.query.shopId;
    } else {
      filter.shopId = shop._id;
    }
    if (req.query.status !== undefined && req.query.status !== '') filter.status = parseInt(req.query.status);
    if (req.query.carrier) filter.carrier = req.query.carrier;

    const { skip, limit, page, pageSize } = paginate(req.query.page, req.query.pageSize);

    const [list, total] = await Promise.all([
      Shipping.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('orderId', 'orderNo finalAmount status'),
      Shipping.countDocuments(filter),
    ]);

    return res.json(success({
      list: list.map(s => ({
        ...s.toObject(),
        statusLabel: TRACKING_STATUS[s.status] || 'Unknown',
        trackingUrl: s.trackingNo ? `https://track.shipit.com/${s.trackingNo}` : '',
      })),
      total,
      page,
      pageSize,
    }));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

const getCarriers = async (req, res) => {
  return res.json(success(CARRIERS));
};

const getStats = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop && req.user.role !== 'admin') return res.json(fail('Shop not found'));

    const filter = {};
    if (req.user.role !== 'admin') filter.shopId = shop._id;

    const stats = await Shipping.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = {};
    Object.keys(TRACKING_STATUS).forEach(k => { result[k] = 0; });
    stats.forEach(s => { result[s._id] = s.count; });

    return res.json(success({ stats: result, labels: TRACKING_STATUS }));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

const publicTrack = async (req, res) => {
  try {
    const { orderNo } = req.query;
    if (!orderNo) return res.json(fail('Order number is required'));

    const order = await Order.findOne({ orderNo: orderNo.trim() });
    if (!order) return res.json(fail('Order not found'));

    const shipping = await Shipping.findOne({ orderId: order._id }).populate('orderId', 'orderNo status finalAmount');
    if (!shipping) return res.json(fail('Tracking information not found for this order'));

    return res.json(success({
      orderNo: order.orderNo,
      carrier: shipping.carrier,
      trackingNo: shipping.trackingNo,
      status: shipping.status,
      statusLabel: TRACKING_STATUS[shipping.status] || 'Unknown',
      estimatedDelivery: shipping.estimatedDelivery,
      statusHistory: (shipping.statusHistory || []).map(h => ({
        ...h,
        statusLabel: TRACKING_STATUS[h.status] || 'Unknown',
      })),
      receiverName: shipping.receiverName,
      receiverPhone: shipping.receiverPhone,
      receiverAddress: shipping.receiverAddress,
    }));
  } catch (err) {
    return res.json(fail(err.message));
  }
};

module.exports = { create, getInfo, updateTracking, list, getCarriers, getStats, publicTrack, CARRIERS, TRACKING_STATUS };
