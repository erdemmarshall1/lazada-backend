const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const favoriteController = require('../controllers/favoriteController');

router.post('/shop', auth, favoriteController.shop);
router.post('/product', auth, favoriteController.product);
router.get('/check/:productId', auth, favoriteController.check);
router.get('/getProductList', auth, favoriteController.getProductList);
router.get('/getBrowseList', auth, favoriteController.getBrowseList);
router.get('/getShopList', auth, favoriteController.getShopList);

module.exports = router;
