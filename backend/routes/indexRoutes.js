const express = require('express');
const router = express.Router();
const { init, getLangData } = require('../controllers/indexController');

router.get('/init', init);
router.get('/getLangData', getLangData);

module.exports = router;
