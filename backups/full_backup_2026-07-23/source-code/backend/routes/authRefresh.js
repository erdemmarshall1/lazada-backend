const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

/**
 * @openapi
 * /home/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens issued
 */
router.post('/refresh', authController.refreshToken);

/**
 * @openapi
 * /home/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout current user, revoke all refresh tokens
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Logged out
 */
router.post('/logout', auth, authController.logout);

/**
 * @openapi
 * /home/auth/verify-email:
 *   post:
 *     tags: [Authentication]
 *     summary: Verify email with 6-digit code
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email', auth, authController.verifyEmail);

module.exports = router;