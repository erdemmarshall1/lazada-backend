const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const shopController = require('../controllers/shopController');

router.get('/getInfo', auth, shopController.getMyShopInfo);
router.post('/apply', auth, shopController.apply);
router.post('/update', auth, shopController.update);
router.get('/getTotalInfo', auth, shopController.getTotalInfo);

module.exports = router;
