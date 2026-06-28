const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');

router.post('/file', auth, upload.single('file'), uploadController.file);
router.get('/getSts', auth, uploadController.getSts);

module.exports = router;
