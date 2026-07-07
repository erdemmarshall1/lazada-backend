const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');
const { auth, sellerAuth, adminAuth } = require('../middleware/auth');

router.post('/create', sellerAuth, shippingController.create);
router.get('/getInfo', auth, shippingController.getInfo);
router.post('/updateTracking', adminAuth, shippingController.updateTracking);
router.get('/list', sellerAuth, shippingController.list);
router.get('/getCarriers', auth, shippingController.getCarriers);
router.get('/getStats', sellerAuth, shippingController.getStats);
router.get('/public/track', shippingController.publicTrack);

module.exports = router;
