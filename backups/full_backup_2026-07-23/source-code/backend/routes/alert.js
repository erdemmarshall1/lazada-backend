const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');

router.get('/getAlertList', alertController.getAlertList);

module.exports = router;
