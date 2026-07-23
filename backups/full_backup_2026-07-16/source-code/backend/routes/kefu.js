const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const kefuController = require('../controllers/kefuController');

router.get('/getSessionId', auth, kefuController.getSessionId);
router.get('/getMsgList', auth, kefuController.getMsgList);
router.post('/sendMsg', auth, kefuController.sendMsg);
router.post('/sendShopMsg', auth, kefuController.sendShopMsg);
router.get('/getShopList', auth, kefuController.getShopList);
router.get('/getUserList', auth, kefuController.getUserList);
router.get('/getSessionInfo', auth, kefuController.getSessionInfo);
router.post('/setRead', auth, kefuController.setRead);
router.get('/getMsgNums', auth, kefuController.getMsgNums);

router.get('/admin/conversations', auth, kefuController.adminGetConversations);
router.get('/admin/messages', auth, kefuController.adminGetMessages);
router.post('/admin/sendReply', auth, kefuController.adminSendReply);

module.exports = router;
