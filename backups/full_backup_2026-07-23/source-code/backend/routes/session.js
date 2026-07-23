const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const sessionCtrl = require('../controllers/sessionController');

/**
 * @openapi
 * /home/session/my-sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: Get current user's active sessions
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active sessions list
 */
router.get('/my-sessions', auth, sessionCtrl.getMySessions);

/**
 * @openapi
 * /home/session/sessions/{id}/revoke:
 *   post:
 *     tags: [Sessions]
 *     summary: Revoke a specific session
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session revoked
 */
router.post('/sessions/:id/revoke', auth, sessionCtrl.revokeSession);

/**
 * @openapi
 * /home/session/sessions/revoke-all:
 *   post:
 *     tags: [Sessions]
 *     summary: Revoke all active sessions
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All sessions revoked
 */
router.post('/sessions/revoke-all', auth, sessionCtrl.revokeAllSessions);

/**
 * @openapi
 * /home/session/admin/sessions:
 *   get:
 *     tags: [Sessions]
 *     summary: Admin - list all active sessions
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated sessions list
 */
router.get('/admin/sessions', adminAuth, sessionCtrl.adminGetSessions);

/**
 * @openapi
 * /home/session/admin/sessions/{id}/revoke:
 *   post:
 *     tags: [Sessions]
 *     summary: Admin - revoke any session
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Session revoked by admin
 */
router.post('/admin/sessions/:id/revoke', adminAuth, sessionCtrl.adminRevokeSession);

/**
 * @openapi
 * /home/session/admin/audit-logs:
 *   get:
 *     tags: [Sessions]
 *     summary: Admin - view audit logs
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string }
 *       - in: query
 *         name: endDate
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 */
router.get('/admin/audit-logs', adminAuth, sessionCtrl.getAuditLogs);

module.exports = router;
