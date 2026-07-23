const Notification = require('../models/Notification');
const { success, fail, paginate } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const { page: p, pageSize: ps, unread } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps || 20);
    const filter = { userId: req.user._id };
    if (unread === 'true') filter.isRead = false;
    const [list, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);
    res.json(success({ list, total, unreadCount, page, pageSize }));
  } catch (error) { res.json(fail(error.message)); }
};

exports.markRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.json(fail('Notification not found'));
    res.json(success(notification));
  } catch (error) { res.json(fail(error.message)); }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json(success(null, 'All notifications marked as read'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.remove = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id, userId: req.user._id,
    });
    if (!notification) return res.json(fail('Notification not found'));
    res.json(success(null, 'Notification deleted'));
  } catch (error) { res.json(fail(error.message)); }
};

exports.createNotification = async (userId, type, title, message, data = {}, link = '', io = null) => {
  try {
    const notification = await Notification.create({ userId, type, title, message, data, link });
    const socketIo = io || (global.io);
    if (socketIo && typeof socketIo.sendNotification === 'function') {
      socketIo.sendNotification(userId, notification);
    }

    // SMS (graceful — skipped when disabled / unconfigured / package missing)
    try {
      const User = require('../models/User');
      const user = await User.findById(userId).select('phone').lean();
      if (user && user.phone) {
        const smsService = require('../services/smsService');
        if (await smsService.isEnabled()) {
          smsService.sendSMS({ to: user.phone, body: smsService.buildBody(title, message) }).catch(() => {});
        }
      }
    } catch (smsErr) { console.error('SMS dispatch error:', smsErr.message); }

    // Web Push (graceful — skipped when disabled / unconfigured / package missing)
    try {
      const pushService = require('../services/pushService');
      if (await pushService.isEnabled()) {
        pushService.sendToUser(userId, { title, message, link, data }).catch(() => {});
      }
    } catch (pushErr) { console.error('Push dispatch error:', pushErr.message); }

    return notification;
  } catch (e) {
    console.error('Failed to create notification:', e.message);
  }
};

exports.createForRequest = async (req, type, title, message, data = {}, link = '') => {
  if (!req.user) return;
  const io = req.app?.get('io');
  return exports.createNotification(req.user._id, type, title, message, data, link, io);
};