const express = require('express');
const router = express.Router();
const { sellerAuth } = require('../middleware/auth');
const storeGoodsController = require('../controllers/storeGoodsController');

router.get('/getList', sellerAuth, storeGoodsController.getList);
router.get('/getInfo', sellerAuth, storeGoodsController.getInfo);

module.exports = router;
