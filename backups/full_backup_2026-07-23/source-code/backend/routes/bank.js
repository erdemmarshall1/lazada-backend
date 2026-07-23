const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const bankCardController = require('../controllers/bankCardController');

router.post('/add', auth, bankCardController.add);
router.post('/del', auth, bankCardController.del);
router.get('/getList', auth, bankCardController.getList);

module.exports = router;
