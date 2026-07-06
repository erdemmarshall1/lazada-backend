const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const twoFactorController = require('../controllers/twoFactorController');

router.get('/getInfo', auth, userController.getInfo);
router.post('/edit', auth, userController.edit);
router.post('/editEmail', auth, userController.editEmail);
router.post('/editMobile', auth, userController.editMobile);
router.post('/editPassword', auth, userController.editPassword);
router.post('/editFundPassword', auth, userController.editFundPassword);

router.post('/2fa/setup', auth, twoFactorController.setup);
router.post('/2fa/verify', auth, twoFactorController.verify);
router.post('/2fa/disable', auth, twoFactorController.disable);
router.post('/2fa/backup-codes', auth, twoFactorController.backupCodes);

module.exports = router;
