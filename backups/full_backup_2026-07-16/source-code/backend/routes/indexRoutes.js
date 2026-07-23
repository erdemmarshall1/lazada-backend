const express = require('express');
const router = express.Router();
const { init, getLangData } = require('../controllers/indexController');
const { success, fail } = require('../utils/response');

router.get('/init', init);
router.get('/getLangData', getLangData);

router.get('/chatwoot-settings', async (req, res) => {
  try {
    const ChatwootSetting = require('../models/ChatwootSetting');
    let settings = await ChatwootSetting.findOne();
    if (!settings) settings = await ChatwootSetting.create({});
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
});

module.exports = router;
