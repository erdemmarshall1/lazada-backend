const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/getInfo', productController.getSkuInfo);

module.exports = router;
