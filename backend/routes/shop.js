const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shopController = require('../controllers/shopController');

router.get('/getList', shopController.getList);
router.get('/getInfo', shopController.getInfo);
router.get('/getGoodsList', shopController.getGoodsList);
router.get('/getCreditMerchantList', shopController.getCreditMerchantList);

module.exports = router;
