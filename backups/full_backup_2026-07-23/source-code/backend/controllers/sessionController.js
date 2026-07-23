const Session = require('../models/Session');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { success, fail, paginate } = require('../utils/response');

// ---- Session Management ----

exports.getMySessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id, isActive: true })
      .sort({ lastActivity: -1 })
      .select('-__v');
    res.json(success(sessions));
  } catch (error) { res.json(fail(error.message)); }
};

exports.revokeSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!session) return res.json(fail('Session not found'));
    res.json(success(null, 'Session revoked'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.revokeAllSessions = async (req, res) => {
  try {
    const crypto = require('crypto');
    const newVersion = crypto.randomBytes(16).toString('hex');
    await User.findByIdAndUpdate(req.user._id, { $set: { tokenVersion: newVersion } });
    await Session.updateMany({ userId: req.user._id, isActive: true }, { isActive: false });
    res.json(success(null, 'All sessions revoked. Please login again.'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.adminGetSessions = async (req, res) => {
  try {
    const { page: p, pageSize: ps, userId } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { isActive: true };
    if (userId) query.userId = userId;
    const [list, total] = await Promise.all([
      Session.find(query).populate('userId', 'username email').sort({ lastActivity: -1 }).skip(skip).limit(limit),
      Session.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.adminRevokeSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!session) return res.json(fail('Session not found'));
    res.json(success(null, 'Session revoked by admin'));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Audit Log ----

exports.getAuditLogs = async (req, res) => {
  try {
    const { page: p, pageSize: ps, userId, action, startDate, endDate } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = { $regex: action, $options: 'i' };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const [list, total] = await Promise.all([
      AuditLog.find(query).populate('userId', 'username email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

// ---- Audit Logger Middleware Factory ----
exports.createAudit = ({ action, resource, getDetails }) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body?.code === 0 && req.user) {
        AuditLog.create({
          userId: req.user._id,
          action,
          resource,
          resourceId: req.params.id || req.body?.id || null,
          details: getDetails ? getDetails(req, body) : {},
          ip: req.ip || req.connection?.remoteAddress || '',
          userAgent: req.headers?.['user-agent'] || '',
        }).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
};

const recordSessionActivity = async (userId, req) => {
  try {
    const device = req.headers?.['user-agent']?.substring(0, 200) || '';
    const ip = req.ip || req.connection?.remoteAddress || '';
    const session = await Session.findOne({ userId, device, ip, isActive: true }).sort({ lastActivity: -1 });
    if (session) {
      session.lastActivity = new Date();
      await session.save();
    } else {
      await Session.create({ userId, device, ip });
    }
  } catch {}
};

exports.recordSessionActivity = recordSessionActivity;
