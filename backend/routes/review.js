const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// Public
router.get('/product/:productId', reviewController.getProductReviews);

// Authenticated
router.post('/add', auth, reviewController.add);
router.put('/:id', auth, reviewController.update);
router.delete('/:id', auth, reviewController.delete);

// Admin
router.get('/admin/list', adminAuth, reviewController.list);
router.get('/admin/:id', adminAuth, reviewController.getById);
router.put('/admin/:id/moderate', adminAuth, reviewController.moderate);
router.put('/admin/:id/reply', adminAuth, reviewController.reply);

module.exports = router;