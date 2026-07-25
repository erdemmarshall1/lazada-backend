const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const translateController = require('../controllers/translateController');

router.post('/translate', adminAuth, translateController.updateTranslation);
router.post('/translate/batch', adminAuth, translateController.batchUpdateTranslations);
router.get('/translate', adminAuth, translateController.getTranslations);
router.get('/translate/untranslated', adminAuth, translateController.listUntranslated);

module.exports = router;
