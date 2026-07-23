const express = require('express');
const router = express.Router();
const { sellerAuth } = require('../middleware/auth');
const storeGoodsController = require('../controllers/storeGoodsController');

router.post('/add', sellerAuth, storeGoodsController.add);
router.post('/edit', sellerAuth, storeGoodsController.edit);
router.post('/up', sellerAuth, storeGoodsController.up);
router.post('/distribute', sellerAuth, storeGoodsController.distribute);
router.get('/getList', sellerAuth, storeGoodsController.getList);

module.exports = router;
