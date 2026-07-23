const Coupon = require('../models/Coupon');
const Order = require('../models/Order');
const { success, fail, paginate } = require('../utils/response');

exports.create = async (req, res) => {
  try {
    const { code, type, value, minOrderAmount, maxDiscount, maxUses, expiresAt, description } = req.body;
    if (!code || !type || value === undefined) return res.json(fail('Code, type, and value are required'));
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return res.json(fail('Coupon code already exists'));
    const coupon = await Coupon.create({
      code: code.toUpperCase(), type, value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount: maxDiscount || 0,
      maxUses: maxUses || 0,
      expiresAt: expiresAt || null,
      description: description || '',
    });
    res.json(success(coupon, 'Coupon created'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.list = async (req, res) => {
  try {
    const { page: p, pageSize: ps, status } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = {};
    if (status !== undefined && status !== '' && status !== '-1') query.status = parseInt(status);
    const [list, total] = await Promise.all([
      Coupon.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.json(fail('Coupon not found'));
    coupon.status = coupon.status === 1 ? 0 : 1;
    await coupon.save();
    res.json(success(coupon, `Coupon ${coupon.status === 1 ? 'activated' : 'deactivated'}`));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.remove = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.json(fail('Coupon not found'));
    res.json(success(null, 'Coupon deleted'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.validate = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) return res.json(fail('Coupon code is required'));

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.json(fail('Invalid coupon code'));
    if (coupon.status !== 1) return res.json(fail('Coupon is not active'));
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.json(fail('Coupon has expired'));
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.json(fail('Coupon usage limit reached'));

    if (orderAmount !== undefined && orderAmount < coupon.minOrderAmount) {
      return res.json(fail(`Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`));
    }

    let discount = 0;
    if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else {
      discount = Math.round(orderAmount * (coupon.value / 100) * 100) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    res.json(success({
      coupon: {
        _id: coupon._id, code: coupon.code, type: coupon.type,
        value: coupon.value, description: coupon.description,
      },
      discount,
      finalAmount: Math.max(0, (orderAmount || 0) - discount),
    }, 'Coupon is valid'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.applyToOrder = async (req, res) => {
  try {
    const { code, orderId } = req.body;
    if (!code || !orderId) return res.json(fail('Coupon code and order ID are required'));

    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.userId.toString() !== req.user._id.toString()) return res.json(fail('Unauthorized'));
    if (order.status !== 0) return res.json(fail('Order cannot be modified'));

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.json(fail('Invalid coupon code'));
    if (coupon.status !== 1) return res.json(fail('Coupon is not active'));
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return res.json(fail('Coupon has expired'));
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) return res.json(fail('Coupon usage limit reached'));
    if (order.totalAmount < coupon.minOrderAmount) {
      return res.json(fail(`Minimum order amount is $${coupon.minOrderAmount.toFixed(2)}`));
    }

    let discount = 0;
    if (coupon.type === 'fixed') {
      discount = Math.min(coupon.value, order.totalAmount);
    } else {
      discount = Math.round(order.totalAmount * (coupon.value / 100) * 100) / 100;
      if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    }

    order.discount = discount;
    order.finalAmount = order.totalAmount - discount;
    order.couponCode = coupon.code;
    await order.save();

    coupon.usedCount += 1;
    await coupon.save();

    res.json(success(order, 'Coupon applied'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
