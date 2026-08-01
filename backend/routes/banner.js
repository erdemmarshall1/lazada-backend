const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const Banner = require('../models/Banner');
const { success, fail } = require('../utils/response');
const { getLang, applyTranslation } = require('../utils/translate');

router.get('/getList', bannerController.getList);

// Active popup advertisements
router.get('/popup', async (req, res) => {
  try {
    const now = new Date();
    const lang = getLang(req);
    const banners = await Banner.find({
      status: 1,
      position: 'popup',
      $or: [
        { popupStartAt: null, popupEndAt: null },
        { popupStartAt: null, popupEndAt: { $gte: now } },
        { popupStartAt: { $lte: now }, popupEndAt: null },
        { popupStartAt: { $lte: now }, popupEndAt: { $gte: now } },
      ],
    }).sort({ sort: 1, createdAt: -1 }).limit(5).lean();
    const list = banners.map(b => applyTranslation(b, lang, ['title']));
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
});

module.exports = router;
