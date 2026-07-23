const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.post('/add', auth, walletController.rechargeAdd);
router.get('/getList', auth, walletController.rechargeGetList);
router.get('/checkFundPassword', auth, walletController.checkFundPassword);

module.exports = router;
