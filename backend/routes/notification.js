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

module.exports = router;
