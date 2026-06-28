const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/getInfo', auth, userController.getInfo);
router.post('/edit', auth, userController.edit);
router.post('/editEmail', auth, userController.editEmail);
router.post('/editMobile', auth, userController.editMobile);
router.post('/editPassword', auth, userController.editPassword);
router.post('/editFundPassword', auth, userController.editFundPassword);

module.exports = router;
