const express = require('express');
const router = express.Router();
const imageProxyController = require('../controllers/imageProxyController');

router.get('/proxy', imageProxyController.proxy);
router.get('/placeholder', imageProxyController.placeholder);

module.exports = router;
