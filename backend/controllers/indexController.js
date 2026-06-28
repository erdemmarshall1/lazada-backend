const Banner = require('../models/Banner');
const Category = require('../models/Category');
const { success, fail } = require('../utils/response');

exports.init = async (req, res) => {
  try {
    const banners = await Banner.find({ status: 1, position: 'home' }).sort({ sort: 1 });
    const categories = await Category.find({ status: 1, level: 1 }).sort({ sort: 1 });
    res.json(success({
      langList: [
        { code: 'zh-CN', name: '简体中文' },
        { code: 'zh-TW', name: '繁體中文' },
        { code: 'en', name: 'English' },
        { code: 'de', name: 'Deutsch' },
        { code: 'fr', name: 'Français' },
        { code: 'ja', name: '日本語' },
        { code: 'es', name: 'español' },
        { code: 'vi', name: 'Tiếng Việt' },
      ],
      banners,
      categories,
      system: {
        WebTitle: 'Shopify Wholesale',
        Lang: 'en',
      },
      webLogo: { logo: '' },
      kefu: '',
    }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getLangData = async (req, res) => {
  try {
    const { lang } = req.query;
    const langData = {};
    res.json(success(langData));
  } catch (error) {
    res.json(fail(error.message));
  }
};
