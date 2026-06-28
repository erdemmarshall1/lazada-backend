const express = require('express');
const router = express.Router();
const indexController = require('../controllers/indexController');

router.get('/init', indexController.init);
router.get('/lang/getData', indexController.getLangData);

module.exports = router;
