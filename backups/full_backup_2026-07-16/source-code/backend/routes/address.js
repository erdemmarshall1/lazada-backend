const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const addressController = require('../controllers/addressController');

router.get('/getList', auth, addressController.getList);
router.post('/add', auth, addressController.add);
router.get('/getInfo', auth, addressController.getInfo);
router.post('/edit', auth, addressController.edit);
router.post('/setDefault', auth, addressController.setDefault);
router.post('/del', auth, addressController.del);

module.exports = router;
