const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');
const twoFactorController = require('../controllers/twoFactorController');
const privacyController = require('../controllers/privacyController');

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

router.get('/privacy-settings', auth, privacyController.getPrivacySettings);
router.post('/privacy-settings', auth, privacyController.updatePrivacySettings);
router.get('/notification-preferences', auth, privacyController.getNotificationPreferences);
router.post('/notification-preferences', auth, privacyController.updateNotificationPreferences);
router.get('/login-history', auth, privacyController.getLoginHistory);
router.post('/delete-account', auth, privacyController.deleteAccount);
router.get('/export-data', auth, privacyController.exportData);
router.post('/logout-all', auth, privacyController.logoutAllSessions);

module.exports = router;
