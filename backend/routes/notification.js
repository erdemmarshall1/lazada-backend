const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

/**
 * @openapi
 * /home/notification/list:
 *   get:
 *     tags: [Notifications]
 *     summary: Get user's notifications
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated notifications list with unread count
 */
router.get('/list', auth, notificationController.list);

/**
 * @openapi
 * /home/notification/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Get unread notification count
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: { count: number }
 */
router.get('/unread-count', auth, async (req, res) => {
  const { success } = require('../utils/response');
  const Notification = require('../models/Notification');
  const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
  res.json(success({ count }));
});

/**
 * @openapi
 * /home/notification/{id}/read:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark notification as read
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:id/read', auth, notificationController.markRead);

/**
 * @openapi
 * /home/notification/read-all:
 *   put:
 *     tags: [Notifications]
 *     summary: Mark all notifications as read
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All marked as read
 */
router.put('/read-all', auth, notificationController.markAllRead);

/**
 * @openapi
 * /home/notification/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Delete a notification
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/:id', auth, notificationController.remove);

/**
 * @openapi
 * /home/notification/vapid-public-key:
 *   get:
 *     tags: [Notifications]
 *     summary: Get VAPID public key for Web Push subscription
 *     responses:
 *       200:
 *         description: VAPID public key (empty when push is disabled)
 */
router.get('/vapid-public-key', async (req, res) => {
  try {
    const pushService = require('../services/pushService');
    const cfg = await pushService.getConfig();
    res.json(require('../utils/response').success({ publicKey: cfg.publicKey || '', enabled: cfg.enabled }));
  } catch (error) {
    res.json(require('../utils/response').fail(error.message));
  }
});

/**
 * @openapi
 * /home/notification/push/subscribe:
 *   post:
 *     tags: [Notifications]
 *     summary: Save a Web Push subscription for the current user
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Subscription saved
 */
router.post('/push/subscribe', auth, async (req, res) => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const sub = req.body && req.body.subscription;
    if (!sub || !sub.endpoint) return res.json(require('../utils/response').fail('Invalid subscription'));
    await PushSubscription.findOneAndUpdate(
      { endpoint: sub.endpoint },
      { user: req.user._id, endpoint: sub.endpoint, subscription: sub },
      { upsert: true, new: true }
    );
    res.json(require('../utils/response').success(null, 'Subscribed to push notifications'));
  } catch (error) {
    res.json(require('../utils/response').fail(error.message));
  }
});

/**
 * @openapi
 * /home/notification/push/unsubscribe:
 *   post:
 *     tags: [Notifications]
 *     summary: Remove the current user's Web Push subscription
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Subscription removed
 */
router.post('/push/unsubscribe', auth, async (req, res) => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const sub = req.body && req.body.subscription;
    const filter = sub && sub.endpoint
      ? { endpoint: sub.endpoint, user: req.user._id }
      : { user: req.user._id };
    await PushSubscription.deleteMany(filter);
    res.json(require('../utils/response').success(null, 'Unsubscribed from push notifications'));
  } catch (error) {
    res.json(require('../utils/response').fail(error.message));
  }
});

module.exports = router;
