const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/reg', authController.register);
router.post('/forgot', authController.forgotPassword);
router.get('/sendMsg/getEmailCode', authController.sendEmailCode);
router.get('/sendMsg/getMobileCode', authController.sendMobileCode);
router.get('/countryArea/getList', authController.getCountryList);

module.exports = router;
