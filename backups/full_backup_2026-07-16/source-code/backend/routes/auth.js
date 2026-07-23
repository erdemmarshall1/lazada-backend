const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

/**
 * @openapi
 * /main/user/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login with username/email/phone + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns tokens + user info
 */
router.post('/login', authController.login);

/**
 * @openapi
 * /main/user/login/2fa:
 *   post:
 *     tags: [Authentication]
 *     summary: Complete 2FA login with TOTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tempToken, token]
 *             properties:
 *               tempToken: { type: string }
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: 2FA verification successful
 */
router.post('/login/2fa', authController.login2fa);

/**
 * @openapi
 * /main/user/reg:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Registration successful
 */
router.post('/reg', authController.register);

/**
 * @openapi
 * /main/user/forgot:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password with code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, password]
 *             properties:
 *               email: { type: string }
 *               code: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/forgot', authController.forgotPassword);

/**
 * @openapi
 * /main/user/sendResetCode:
 *   post:
 *     tags: [Authentication]
 *     summary: Send password reset code to email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset code sent
 */
router.post('/sendResetCode', authController.sendResetCode);

router.get('/sendMsg/getEmailCode', authController.sendEmailCode);
router.get('/sendMsg/getMobileCode', authController.sendMobileCode);
router.get('/countryArea/getList', authController.getCountryList);
router.post('/setup-password', auth, authController.setupPassword);

module.exports = router;
