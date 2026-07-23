const express = require('express');
const router = express.Router();
const { init, getLangData } = require('../controllers/indexController');
const { success, fail } = require('../utils/response');

router.get('/init', init);
router.get('/getLangData', getLangData);

router.get('/tawkto-settings', async (req, res) => {
  try {
    const TawkToSetting = require('../models/TawkToSetting');
    let settings = await TawkToSetting.findOne();
    if (!settings) settings = await TawkToSetting.create({});
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
});

module.exports = router;
