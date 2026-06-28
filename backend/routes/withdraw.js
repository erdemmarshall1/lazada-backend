const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.post('/add', auth, walletController.withdrawAdd);
router.get('/getList', auth, walletController.withdrawGetList);

module.exports = router;
