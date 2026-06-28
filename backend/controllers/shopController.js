const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const InvitationCode = require('../models/InvitationCode');
const { success, fail, paginate } = require('../utils/response');

exports.getList = async (req, res) => {
  try {
    const { page: p, pageSize: ps, keyword } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { status: 1 };
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    const [list, total] = await Promise.all([
      Shop.find(query).sort({ salesCount: -1 }).skip(skip).limit(limit),
      Shop.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInfo = async (req, res) => {
  try {
    const shop = await Shop.findById(req.query.id).populate('userId', 'username');
    if (!shop) return res.json(fail('Shop not found'));
    if (shop.logo && shop.logo.startsWith('/uploads/')) shop.logo = DEFAULT_STORE_LOGO
    res.json(success(shop));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getGoodsList = async (req, res) => {
  try {
    const { shopId, page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { shopId, status: 1 };
    const [list, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

const DEFAULT_STORE_LOGO = 'https://cdn.pixabay.com/photo/2016/03/27/19/32/online-store-1284033_1280.png'

exports.getMyShopInfo = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    if (shop.logo && shop.logo.startsWith('/uploads/')) shop.logo = DEFAULT_STORE_LOGO
    res.json(success(shop));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.apply = async (req, res) => {
  try {
    const {
      name, description, phone, address, fullName, email,
      password, invitationCode, storeLogo, idFrontImage, idBackImage, utilityBill, idNumber,
    } = req.body;
    if (!invitationCode) {
      return res.json(fail('Invitation code is required'));
    }
    const invitationDoc = await InvitationCode.findOne({ code: invitationCode, isActive: true, usedBy: null });
    if (!invitationDoc) {
      return res.json(fail('Invalid or already used invitation code'));
    }
    const existing = await Shop.findOne({ userId: req.user._id });
    if (existing) return res.json(fail('You already have a shop'));
    const shop = await Shop.create({
      userId: req.user._id, name, description, phone, address,
      fullName: fullName || '', email: email || '',
      logo: storeLogo || '', idFrontImage: idFrontImage || '',
      idBackImage: idBackImage || '', utilityBill: utilityBill || '',
      idNumber: idNumber || '', invitationCode: invitationCode || '',
      status: 0,
    });
    await InvitationCode.findByIdAndUpdate(invitationDoc._id, { usedBy: shop._id, usedAt: new Date() });
    const updateData = { role: 'seller' };
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    await User.findByIdAndUpdate(req.user._id, updateData);
    if (password) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.fundPassword = password;
        await user.save();
      }
    }
    res.json(success(shop, 'Application submitted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, phone, address, fullName, email, storeLogo, idNumber } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    if (name !== undefined) shop.name = name;
    if (description !== undefined) shop.description = description;
    if (phone !== undefined) shop.phone = phone;
    if (address !== undefined) shop.address = address;
    if (fullName !== undefined) shop.fullName = fullName;
    if (email !== undefined) shop.email = email;
    if (storeLogo !== undefined) shop.logo = storeLogo;
    if (idNumber !== undefined) shop.idNumber = idNumber;
    await shop.save();
    res.json(success(shop, 'Store updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getTotalInfo = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(fail('No shop found'));
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999)
    const [productCount, orderCount, totalSales, ordersByStatus, pendingShipmentCount, refundRequestCount, todayOrderCount, todayRevenueArr] = await Promise.all([
      Product.countDocuments({ shopId: shop._id }),
      Order.countDocuments({ shopId: shop._id }),
      Order.aggregate([
        { $match: { shopId: shop._id, status: { $in: [3, 4, 5] } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      Order.aggregate([
        { $match: { shopId: shop._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Order.countDocuments({ shopId: shop._id, status: 1 }),
      Order.countDocuments({ shopId: shop._id, refundStatus: 1 }),
      Order.countDocuments({ shopId: shop._id, createdAt: { $gte: todayStart, $lte: todayEnd } }),
      Order.aggregate([
        { $match: { shopId: shop._id, status: { $in: [3, 4, 5] }, paymentTime: { $gte: todayStart, $lte: todayEnd } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
    ]);
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const monthlyRevenue = await Order.aggregate([
      { $match: { shopId: shop._id, status: { $in: [3, 5] }, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, total: { $sum: '$finalAmount' } } },
      { $sort: { _id: 1 } },
    ])
    const monthlyOrders = await Order.aggregate([
      { $match: { shopId: shop._id, createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    const statusMap = ordersByStatus.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc }, {})

    const completedOrders = await Order.countDocuments({ shopId: shop._id, status: 3 })
    const cancelledOrders = await Order.countDocuments({ shopId: shop._id, status: 6 })
    const totalProcessed = completedOrders + cancelledOrders
    const creditScore = totalProcessed === 0 ? 100 : Math.round((completedOrders / totalProcessed) * 100)

    const profitResult = await Product.aggregate([
      { $match: { shopId: shop._id, profitPercentage: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgPct: { $avg: '$profitPercentage' } } },
    ])
    const avgProfitPct = (profitResult.length > 0 ? profitResult[0].avgPct : 20) || 20
    const totalSalesAmount = totalSales.length > 0 ? totalSales[0].total : 0
    const todayRevenueAmount = todayRevenueArr.length > 0 ? todayRevenueArr[0].total : 0
    const profitMultiplier = avgProfitPct / (100 + avgProfitPct)
    const totalProfit = totalSalesAmount * profitMultiplier
    const todayProfit = todayRevenueAmount * profitMultiplier
    const monthlyProfits = monthlyRevenue.map(m => ({
      _id: m._id,
      total: m.total * profitMultiplier,
    }))

    res.json(success({
      productCount, orderCount,
      totalSales: totalSalesAmount,
      totalProfit,
      todayProfit,
      avgProfitPct,
      ordersByStatus: statusMap,
      pendingShipmentCount,
      refundRequestCount,
      monthlyRevenue,
      monthlyProfits,
      monthlyOrders,
      todayOrderCount,
      todayRevenue: todayRevenueAmount,
      creditScore,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};
