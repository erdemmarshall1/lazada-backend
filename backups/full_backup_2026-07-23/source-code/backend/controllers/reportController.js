const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const PlatformWallet = require('../models/PlatformWallet');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Shop = require('../models/Shop');
const { success, fail, paginate } = require('../utils/response');

exports.getDashboard = async (req, res) => {
  try {
    const [userCount, productCount, orderCount, revenueAgg, platformWallet] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ status: 1 }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: [3, 4, 5] } } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } },
      ]),
      PlatformWallet.findOne(),
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;
    res.json(success({
      totalUsers: userCount,
      totalProducts: productCount,
      totalOrders: orderCount,
      totalRevenue,
      platformBalance: platformWallet?.balance || 0,
      platformRevenue: platformWallet?.totalRevenue || 0,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day', page, pageSize } = req.query;
    const match = { status: { $in: [3, 4, 5] } };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const dateFormat = groupBy === 'month' ? '%Y-%m' : groupBy === 'year' ? '%Y' : '%Y-%m-%d';

    const [overview, timeSeries, topProducts, paymentBreakdown, categorySales, paginatedOrders, recentOrders, recentPayments, recentShopApps] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalShipping: { $sum: '$shippingFee' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$finalAmount' },
        }},
      ]),
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
          revenue: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
          discount: { $sum: '$discount' },
        }},
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 20 },
      ]),
      Order.aggregate([
        { $match: match },
        { $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$finalAmount' },
        }},
      ]),
      Order.aggregate([
        { $match: match },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: '$product.categoryId',
          categoryName: { $first: '$product.categoryId' },
          totalRevenue: { $sum: '$items.subtotal' },
          totalSold: { $sum: '$items.quantity' },
        }},
        { $sort: { totalRevenue: -1 } },
      ]),
      Order.find(match).sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize))
        .lean(),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username email').lean(),
      Transaction.find({ status: 0 }).sort({ createdAt: -1 }).limit(10).populate('userId', 'username email').lean(),
      Shop.find({ status: 0 }).sort({ createdAt: -1 }).limit(10).populate('userId', 'username email').lean(),
    ]);

    const catIds = categorySales.filter(c => c._id).map(c => c._id);
    if (catIds.length > 0) {
      const cats = await Category.find({ _id: { $in: catIds } }).lean();
      const catMap = {};
      cats.forEach(c => { catMap[c._id.toString()] = c.name; });
      categorySales.forEach(c => { if (c._id) c.categoryName = catMap[c._id.toString()] || 'Unknown'; });
    }

    const totalOrders = await Order.countDocuments(match);

    res.json(success({
      overview: overview[0] || { totalRevenue: 0, totalDiscount: 0, totalShipping: 0, orderCount: 0, avgOrderValue: 0 },
      timeSeries,
      topProducts,
      paymentBreakdown,
      categorySales,
      orders: paginatedOrders,
      recentOrders,
      recentPayments,
      recentShopApps,
      total: totalOrders,
      page: Number(page) || 1,
      pageSize: Number(pageSize) || 20,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, pageSize = 20 } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [totalUsers, newUsers, roleBreakdown, topCustomers] = await Promise.all([
      User.countDocuments(match),
      User.countDocuments({ ...match, status: 1 }),
      User.aggregate([
        { $match: match },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $in: [3, 4, 5] } } },
        { $group: {
          _id: '$userId',
          totalSpent: { $sum: '$finalAmount' },
          orderCount: { $sum: 1 },
        }},
        { $sort: { totalSpent: -1 } },
        { $limit: 20 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { 'user.password': 0 } },
      ]),
    ]);

    res.json(success({
      totalUsers,
      activeUsers: newUsers,
      roleBreakdown,
      topCustomers,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInventoryReport = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, lowStock = 10 } = req.query;
    const lowStockThreshold = Number(lowStock);
    const skip = (Number(page) - 1) * Number(pageSize);

    const [products, total, overview] = await Promise.all([
      Product.find({ status: 1 })
        .select('name skus.stock skus.price minPrice maxPrice salesCount categoryId')
        .populate('categoryId', 'name')
        .sort({ 'skus.stock': 1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Product.countDocuments({ status: 1 }),
      Product.aggregate([
        { $match: { status: 1 } },
        { $unwind: '$skus' },
        { $group: {
          _id: null,
          totalStock: { $sum: '$skus.stock' },
          totalValue: { $sum: { $multiply: ['$skus.stock', '$skus.price'] } },
          lowStockCount: { $sum: { $cond: [{ $lte: ['$skus.stock', lowStockThreshold] }, 1, 0] } },
          outOfStockCount: { $sum: { $cond: [{ $eq: ['$skus.stock', 0] }, 1, 0] } },
          avgStock: { $avg: '$skus.stock' },
        }},
      ]),
    ]);

    const enriched = products.map(p => {
      const totalStock = p.skus?.reduce((sum, s) => sum + (s.stock || 0), 0) || 0;
      const totalValue = p.skus?.reduce((sum, s) => sum + ((s.stock || 0) * (s.price || 0)), 0) || 0;
      const minSkuStock = p.skus?.length ? Math.min(...p.skus.map(s => s.stock || 0)) : 0;
      return {
        _id: p._id,
        name: p.name,
        category: p.categoryId?.name || 'N/A',
        totalStock,
        totalValue,
        minSkuStock,
        salesCount: p.salesCount || 0,
        isLowStock: minSkuStock <= lowStockThreshold,
      };
    });

    res.json(success({
      overview: overview[0] || { totalStock: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0, avgStock: 0 },
      products: enriched,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const [revenueAgg, txAgg, platformWallet, refundAgg] = await Promise.all([
      Order.aggregate([
        { $match: { ...match, status: { $in: [3, 4, 5] } } },
        { $group: {
          _id: null,
          grossRevenue: { $sum: '$totalAmount' },
          netRevenue: { $sum: '$finalAmount' },
          totalDiscount: { $sum: '$discount' },
          totalShipping: { $sum: '$shippingFee' },
          orderCount: { $sum: 1 },
        }},
      ]),
      Transaction.aggregate([
        { $match: { ...match, status: 1 } },
        { $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
        }},
      ]),
      PlatformWallet.findOne(),
      Order.aggregate([
        { $match: { ...match, refundStatus: { $gt: 0 } } },
        { $group: {
          _id: null,
          refundCount: { $sum: 1 },
          totalRefunded: { $sum: '$refundAmount' },
        }},
      ]),
    ]);

    const revenue = revenueAgg[0] || { grossRevenue: 0, netRevenue: 0, totalDiscount: 0, totalShipping: 0, orderCount: 0 };
    const refunds = refundAgg[0] || { refundCount: 0, totalRefunded: 0 };

    const txMap = {};
    txAgg.forEach(t => { txMap[t._id] = t.totalAmount; });

    const estimatedProfit = revenue.netRevenue * 0.2;

    res.json(success({
      revenue,
      refunds,
      transactions: txMap,
      platformWallet: platformWallet ? { balance: platformWallet.balance, escrowBalance: platformWallet.escrowBalance, totalRevenue: platformWallet.totalRevenue } : null,
      estimatedProfit,
      netProfit: revenue.netRevenue - refunds.totalRefunded,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getProductPerformance = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, sortBy = 'salesCount', categoryId } = req.query;
    const match = { status: 1 };
    if (categoryId) match.categoryId = categoryId;

    const sortField = sortBy === 'revenue' ? 'revenue' : sortBy === 'rating' ? 'rating' : 'salesCount';
    const sortDir = -1;

    const [products, total] = await Promise.all([
      Product.aggregate([
        { $match: match },
        { $lookup: { from: 'categories', localField: 'categoryId', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: {
          name: 1,
          minPrice: 1,
          maxPrice: 1,
          salesCount: 1,
          reviewCount: 1,
          rating: 1,
          'category.name': 1,
          revenue: { $multiply: ['$salesCount', '$minPrice'] },
        }},
        { $sort: { [sortField]: sortDir } },
        { $skip: (Number(page) - 1) * Number(pageSize) },
        { $limit: Number(pageSize) },
      ]),
      Product.countDocuments(match),
    ]);

    res.json(success({
      products,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};
