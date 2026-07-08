const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/list', auth, notificationController.list);
router.get('/unread-count', auth, async (req, res) => {
  const { success } = require('../utils/response');
  const Notification = require('../models/Notification');
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json(success({ count }));
});
router.put('/:id/read', auth, notificationController.markRead);
router.put('/read-all', auth, notificationController.markAllRead);
router.delete('/:id', auth, notificationController.remove);

module.exports = router;