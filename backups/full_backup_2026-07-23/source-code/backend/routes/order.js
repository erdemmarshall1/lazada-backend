const express = require('express');
const router = express.Router();
const { auth, sellerAuth } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

/**
 * @openapi
 * /home/userOrder/add:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shopId: { type: string }
 *               items: { type: array, items: { type: object, properties: { productId: { type: string }, skuId: { type: string }, quantity: { type: integer } } } }
 *               shippingAddressId: { type: string }
 *               buyerMessage: { type: string }
 *     responses:
 *       200:
 *         description: Order created
 */
router.post('/add', auth, orderController.add);

/**
 * @openapi
 * /home/userOrder/pay:
 *   post:
 *     tags: [Orders]
 *     summary: Pay for an order
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId: { type: string }
 *               paymentMethod: { type: string }
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/pay', auth, orderController.pay);

/**
 * @openapi
 * /home/userOrder/getList:
 *   get:
 *     tags: [Orders]
 *     summary: Get user's orders with filters
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: integer }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated orders list
 */
router.get('/getList', auth, orderController.getList);

router.post('/payCart', auth, orderController.payCart);
router.get('/getInfo', auth, orderController.getInfo);
router.post('/cancel', auth, orderController.cancel);
router.post('/confirmArrival', auth, orderController.confirmArrival);
router.post('/refund', auth, orderController.refund);
router.get('/getExpressInfo', auth, orderController.getExpressInfo);
router.post('/editOrderAddress', auth, orderController.editOrderAddress);
router.get('/getCartList', auth, orderController.getCartList);
router.post('/addCart', auth, orderController.addCart);
router.post('/editCart', auth, orderController.editCart);
router.post('/delCart', auth, orderController.delCart);

/**
 * @openapi
 * /home/userOrder/getShopOrderList:
 *   get:
 *     tags: [Orders]
 *     summary: Seller - get shop orders
 *     security: [{ BearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Shop orders list
 */
router.get('/getShopOrderList', sellerAuth, orderController.getShopOrderList);
router.post('/ship', sellerAuth, orderController.ship);
router.post('/agree', sellerAuth, orderController.agreeRefund);
router.post('/reject', sellerAuth, orderController.rejectRefund);

module.exports = router;
