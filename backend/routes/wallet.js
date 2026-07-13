const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const walletController = require('../controllers/walletController');

router.post('/add', auth, walletController.add);
router.post('/update', auth, walletController.update);
router.post('/del', auth, walletController.del);
router.get('/getList', auth, walletController.getList);
router.get('/getAddressList', auth, walletController.getAddressList);

module.exports = router;
