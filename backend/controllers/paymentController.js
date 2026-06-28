const stripe = require('stripe')(require('../config/app').STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const PlatformWallet = require('../models/PlatformWallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { success, fail } = require('../utils/response');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.json(fail('Order not found'));
    if (order.userId.toString() !== req.user._id.toString()) return res.json(fail('Unauthorized'));
    if (order.status !== 0) return res.json(fail('Order cannot be paid'));

    const amountInCents = Math.round(order.finalAmount * 100);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
    });

    res.json(success({
      clientSecret: paymentIntent.client_secret,
      publishableKey: require('../config/app').STRIPE_PUBLISHABLE_KEY,
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    const webhookSecret = require('../config/app').STRIPE_WEBHOOK_SECRET;
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    if (order && order.status === 0) {
      await PlatformWallet.findOneAndUpdate(
        {}, { $inc: { escrowBalance: order.finalAmount } }, { upsert: true }
      );

      order.status = 1;
      order.paymentTime = new Date();
      order.paymentMethod = 'stripe';
      await order.save();

      await Transaction.create({
        userId: order.userId, type: 'payment', amount: -order.finalAmount,
        balanceBefore: 0, balanceAfter: 0,
        orderId: order._id,
        description: `Stripe payment for order ${order.orderNo}`,
      });

      console.log(`Stripe payment succeeded for order ${order.orderNo}`);
    }
  }

  res.json({ received: true });
};
