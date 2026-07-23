const Message = require('../models/Message');
const { success, fail, paginate } = require('../utils/response');

exports.getList = async (req, res) => {
  try {
    const { page: p, pageSize: ps } = req.query;
    const { skip, limit, page, pageSize } = paginate(p, ps);
    const query = { toUserId: req.user._id, type: 'internal' };
    const [list, total] = await Promise.all([
      Message.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('fromUserId', 'username'),
      Message.countDocuments(query),
    ]);
    res.json(success({ list, total, page, pageSize }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.setIsRead = async (req, res) => {
  try {
    const { id } = req.body;
    await Message.findByIdAndUpdate(id, { isRead: true, readAt: new Date() });
    res.json(success(null, 'Message marked as read'));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getInfo = async (req, res) => {
  try {
    const msg = await Message.findById(req.query.id);
    if (!msg) return res.json(fail('Message not found'));
    res.json(success(msg));
  } catch (error) {
    res.json(fail(error.message));
  }
};
