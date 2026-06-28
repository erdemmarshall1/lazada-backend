const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.get('/getList', auth, walletController.getAmountList);

module.exports = router;
