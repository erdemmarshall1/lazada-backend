const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/refresh', authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.post('/verify-email', auth, authController.verifyEmail);

module.exports = router;