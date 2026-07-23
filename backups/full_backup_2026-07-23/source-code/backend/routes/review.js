const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

/**
 * @openapi
 * /home/goodsReviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a product
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated reviews with rating stats
 */
router.get('/product/:productId', reviewController.getProductReviews);

/**
 * @openapi
 * /home/goodsReviews/add:
 *   post:
 *     tags: [Reviews]
 *     summary: Add a product review
 *     security: [{ BearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, orderId, rating]
 *             properties:
 *               productId: { type: string }
 *               orderId: { type: string }
 *               rating: { type: integer, minimum: 1, maximum: 5 }
 *               content: { type: string }
 *               images: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Review created
 */
router.post('/add', auth, reviewController.add);
router.put('/:id', auth, reviewController.update);
router.delete('/:id', auth, reviewController.delete);

/**
 * @openapi
 * /home/goodsReviews/admin/list:
 *   get:
 *     tags: [Reviews]
 *     summary: Admin - list all reviews for moderation
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, approved, rejected, spam] }
 *     responses:
 *       200:
 *         description: Paginated review list
 */
router.get('/admin/list', adminAuth, reviewController.list);
router.get('/admin/:id', adminAuth, reviewController.getById);

/**
 * @openapi
 * /home/goodsReviews/admin/{id}/moderate:
 *   put:
 *     tags: [Reviews]
 *     summary: Admin - moderate a review (approve/reject/spam)
 *     security: [{ BearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [approved, rejected, pending, spam] }
 *     responses:
 *       200:
 *         description: Review moderated
 */
router.put('/admin/:id/moderate', adminAuth, reviewController.moderate);
router.put('/admin/:id/reply', adminAuth, reviewController.reply);

module.exports = router;
