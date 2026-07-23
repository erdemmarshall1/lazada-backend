const express = require('express');
const router = express.Router();
const { init, getLangData } = require('../controllers/indexController');
const { success, fail } = require('../utils/response');

router.get('/init', init);
router.get('/getLangData', getLangData);

module.exports = router;
