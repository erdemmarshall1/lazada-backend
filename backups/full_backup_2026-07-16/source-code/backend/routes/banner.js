const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');

router.get('/getList', bannerController.getList);

module.exports = router;
