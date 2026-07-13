const Message = require('../models/Message');
const Shop = require('../models/Shop');
const { success, fail } = require('../utils/response');
const { v4: uuidv4 } = require('uuid');

exports.getSessionId = async (req, res) => {
  const sessionId = uuidv4();
  res.json(success({ sessionId }));
};

exports.getMsgList = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const query = sessionId ? { sessionId } : {};
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(50);
    res.json(success(messages));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.sendMsg = async (req, res) => {
  try {
    const { content, type, toUserId, shopId, sessionId } = req.body;
    const msg = await Message.create({
      fromUserId: req.user._id, toUserId, shopId,
      content, type: type || 'text', sessionId,
    });
    res.json(success(msg, 'Message sent'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.sendShopMsg = async (req, res) => {
  try {
    const { content, type, toUserId, sessionId } = req.body;
    const shop = await Shop.findOne({ userId: req.user._id });
    const msg = await Message.create({
      fromUserId: req.user._id, toUserId, shopId: shop?._id,
      content, type: type || 'text', sessionId,
    });
    res.json(success(msg, 'Message sent'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getShopList = async (req, res) => {
  try {
    const shop = await Shop.findOne({ userId: req.user._id });
    if (!shop) return res.json(success([]));
    const userIds = await Message.distinct('fromUserId', { shopId: shop._id });
    res.json(success(userIds));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getUserList = async (req, res) => {
  try {
    const shopIds = await Message.distinct('shopId', { fromUserId: req.user._id });
    const shops = await Shop.find({ _id: { $in: shopIds } });
    res.json(success(shops));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getSessionInfo = async (req, res) => {
  res.json(success({}));
};

exports.setRead = async (req, res) => {
  try {
    const { sessionId } = req.body;
    await Message.updateMany(
      { sessionId, toUserId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json(success(null, 'Messages marked as read'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getMsgNums = async (req, res) => {
  try {
    const count = await Message.countDocuments({ toUserId: req.user._id, isRead: false });
    res.json(success({ total: count }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminGetConversations = async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$fromUserId', lastMessage: { $first: '$$ROOT' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { userId: '$_id', lastMessage: 1, user: { username: 1, avatar: 1, email: 1 } } },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
    res.json(success({ conversations, agentOnline: true }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminGetMessages = async (req, res) => {
  try {
    const { userId } = req.query;
    const messages = await Message.find({
      $or: [{ fromUserId: userId, toUserId: req.user._id }, { fromUserId: req.user._id, toUserId: userId }],
    }).sort({ createdAt: 1 }).limit(100);
    res.json(success(messages));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.adminSendReply = async (req, res) => {
  try {
    const { toUserId, content } = req.body;
    const msg = await Message.create({
      fromUserId: req.user._id,
      toUserId,
      content,
      type: 'text',
      sessionId: `admin_${req.user._id}_${toUserId}`,
    });
    res.json(success(msg, 'Reply sent'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
