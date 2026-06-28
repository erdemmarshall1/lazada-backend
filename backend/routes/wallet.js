const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.post('/add', auth, walletController.add);
router.post('/del', auth, walletController.del);
router.get('/getList', auth, walletController.getList);

module.exports = router;
