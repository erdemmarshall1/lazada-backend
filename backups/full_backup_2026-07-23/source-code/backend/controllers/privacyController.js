const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const { success, fail, paginate } = require('../utils/response');

exports.getPrivacySettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings email phone username twoFactorEnabled');
    if (!user) return res.json(fail('User not found'));
    const ps = user.privacySettings || {};
    res.json(success({
      emailNotifications: ps.emailNotifications || { orderUpdates: true, promotions: true, shipping: true, payments: true },
      profileVisibility: ps.profileVisibility || 'private',
      showEmail: ps.showEmail ?? false,
      showPhone: ps.showPhone ?? false,
      loginAlerts: ps.loginAlerts ?? true,
      cookieConsent: ps.cookieConsent ?? null,
      email: user.email,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.updatePrivacySettings = async (req, res) => {
  try {
    const allowed = ['profileVisibility', 'showEmail', 'showPhone', 'loginAlerts', 'cookieConsent'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[`privacySettings.${key}`] = req.body[key];
      }
    }
    if (req.body.emailNotifications) {
      const notifKeys = ['orderUpdates', 'promotions', 'shipping', 'payments'];
      for (const k of notifKeys) {
        if (req.body.emailNotifications[k] !== undefined) {
          update[`privacySettings.emailNotifications.${k}`] = req.body.emailNotifications[k];
        }
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, { $set: update }, { new: true });
    if (!user) return res.json(fail('User not found'));
    res.json(success(null, 'Privacy settings updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('privacySettings.emailNotifications email');
    if (!user) return res.json(fail('User not found'));
    const prefs = user.privacySettings?.emailNotifications || { orderUpdates: true, promotions: true, shipping: true, payments: true };
    res.json(success({ email: user.email, preferences: prefs }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const allowed = ['orderUpdates', 'promotions', 'shipping', 'payments'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        update[`privacySettings.emailNotifications.${key}`] = req.body[key];
      }
    }
    await User.findByIdAndUpdate(req.user._id, { $set: update });
    res.json(success(null, 'Notification preferences updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const [list, total] = await Promise.all([
      LoginHistory.find({ userId: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LoginHistory.countDocuments({ userId: req.user._id }),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.json(fail('Password required to delete account'));
    const user = await User.findById(req.user._id);
    if (!user) return res.json(fail('User not found'));
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.json(fail('Invalid password'));
    user.status = 0;
    user.email = `deleted_${user._id}@deleted.com`;
    user.username = `deleted_${user._id}`;
    user.password = require('crypto').randomBytes(32).toString('hex');
    user.phone = '';
    user.privacySettings = {};
    user.twoFactorEnabled = false;
    user.twoFactorSecret = '';
    user.backupCodes = [];
    await user.save();
    res.json(success(null, 'Account deactivated. Your data has been anonymized.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.exportData = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -fundPassword -backupCodes -twoFactorSecret');
    if (!user) return res.json(fail('User not found'));
    const Order = require('../models/Order');
    const Transaction = require('../models/Transaction');
    const Address = require('../models/Address');
    const orders = await Order.find({ userId: user._id }).lean();
    const transactions = await Transaction.find({ userId: user._id }).lean();
    const addresses = await Address.find({ userId: user._id }).lean();
    res.json(success({
      exportedAt: new Date().toISOString(),
      user: user.toJSON ? user.toJSON() : user,
      orders,
      transactions,
      addresses,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.logoutAllSessions = async (req, res) => {
  try {
    const crypto = require('crypto');
    const newTokenVersion = crypto.randomBytes(16).toString('hex');
    await User.findByIdAndUpdate(req.user._id, { $set: { tokenVersion: newTokenVersion } });
    res.json(success(null, 'All other sessions logged out. Please login again.'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminGetUserPrivacy = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('username email phone role status privacySettings twoFactorEnabled createdAt');
    if (!user) return res.json(fail('User not found'));
    res.json(success(user));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminToggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { status: status === 0 ? 0 : 1 }, { new: true });
    if (!user) return res.json(fail('User not found'));
    res.json(success(user, status === 0 ? 'User disabled' : 'User enabled'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminGetAuditLog = async (req, res) => {
  try {
    const { page: p, pageSize: ps, userId } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = {};
    if (userId) query.userId = userId;
    const [list, total] = await Promise.all([
      LoginHistory.find(query).populate('userId', 'username email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      LoginHistory.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};
