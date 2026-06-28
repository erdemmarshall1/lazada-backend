const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.get('/getList', auth, messageController.getList);
router.post('/setIsRead', auth, messageController.setIsRead);
router.get('/getInfo', auth, messageController.getInfo);

module.exports = router;
