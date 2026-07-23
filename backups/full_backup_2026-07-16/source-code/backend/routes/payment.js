const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.post('/create-payment-intent', auth, paymentController.createPaymentIntent);

// Webhook is at root when mounted at /home/payment/webhook
// (raw body parser is applied in server.js before this router is invoked)
router.post('/', paymentController.handleWebhook);

module.exports = router;
