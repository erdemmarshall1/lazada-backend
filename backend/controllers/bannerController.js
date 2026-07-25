const Banner = require('../models/Banner');
const { success, fail } = require('../utils/response');
const { getLang, applyTranslation } = require('../utils/translate');

exports.getList = async (req, res) => {
  try {
    const lang = getLang(req);
    const list = await Banner.find({ status: 1 }).sort({ sort: 1 });
    res.json(success(list.map(b => applyTranslation(b, lang, ['title']))));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getActivityGoodsList = async (req, res) => {
  try {
    const lang = getLang(req);
    const banners = await Banner.find({ status: 1, position: 'home' }).sort({ sort: 1 });
    res.json(success(banners.map(b => applyTranslation(b, lang, ['title']))));
  } catch (error) {
    res.json(fail(error.message));
  }
};
