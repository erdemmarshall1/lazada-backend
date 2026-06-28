const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/getInfo', productController.getInfo);
router.get('/getSearchList', productController.getSearchList);
router.get('/getRandList', productController.getRandList);
router.get('/getData', productController.getData);
router.get('/getHotList', productController.getHotList);
router.get('/getReviewsList', productController.getReviewsList);

module.exports = router;
