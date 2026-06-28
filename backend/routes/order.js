const express = require('express');
const router = express.Router();
const { auth, sellerAuth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

router.post('/add', auth, orderController.add);
router.post('/pay', auth, orderController.pay);
router.post('/payCart', auth, orderController.payCart);
router.get('/getInfo', auth, orderController.getInfo);
router.get('/getList', auth, orderController.getList);
router.post('/cancel', auth, orderController.cancel);
router.post('/confirmArrival', auth, orderController.confirmArrival);
router.post('/refund', auth, orderController.refund);
router.get('/getExpressInfo', auth, orderController.getExpressInfo);
router.post('/editOrderAddress', auth, orderController.editOrderAddress);
router.get('/getCartList', auth, orderController.getCartList);
router.post('/addCart', auth, orderController.addCart);
router.post('/editCart', auth, orderController.editCart);
router.post('/delCart', auth, orderController.delCart);
router.get('/getShopOrderList', sellerAuth, orderController.getShopOrderList);
router.post('/ship', sellerAuth, orderController.ship);
router.post('/agree', sellerAuth, orderController.agreeRefund);
router.post('/reject', sellerAuth, orderController.rejectRefund);

module.exports = router;
