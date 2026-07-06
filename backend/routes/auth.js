const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/login/2fa', authController.login2fa);
router.post('/reg', authController.register);
router.post('/forgot', authController.forgotPassword);
router.get('/sendMsg/getEmailCode', authController.sendEmailCode);
router.get('/sendMsg/getMobileCode', authController.sendMobileCode);
router.get('/countryArea/getList', authController.getCountryList);
router.post('/setup-password', auth, authController.setupPassword);

module.exports = router;
