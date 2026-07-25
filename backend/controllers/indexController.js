const Banner = require('../models/Banner');
const Category = require('../models/Category');
const SystemSettings = require('../models/SystemSettings');
const { success, fail } = require('../utils/response');
const { getLang, applyTranslation } = require('../utils/translate');

exports.init = async (req, res) => {
  try {
    const lang = getLang(req);
    const banners = (await Banner.find({ status: 1, position: 'home' }).sort({ sort: 1 }))
      .map(b => applyTranslation(b, lang, ['title']));
    const categories = (await Category.find({ status: 1, level: 1 }).sort({ sort: 1 }))
      .map(c => applyTranslation(c, lang, ['name']));
    let themeSettings = await SystemSettings.findOne();
    if (!themeSettings) {
      themeSettings = await SystemSettings.create({});
    }
    const siteName = applyTranslation(themeSettings, lang, ['siteName']);
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
        { code: 'ko', name: '한국어' },
        { code: 'pt', name: 'Português' },
        { code: 'ru', name: 'Русский' },
        { code: 'it', name: 'Italiano' },
        { code: 'th', name: 'ไทย' },
        { code: 'ar', name: 'العربية' },
        { code: 'tr', name: 'Türkçe' },
        { code: 'nl', name: 'Nederlands' },
        { code: 'pl', name: 'Polski' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'id', name: 'Bahasa Indonesia' },
        { code: 'ms', name: 'Bahasa Melayu' },
      ],
      banners,
      categories,
      system: {
        WebTitle: siteName.siteName || 'THE OUTNET WHOLESALE',
        Lang: 'en',
      },
      webLogo: { logo: themeSettings.logoUrl || '' },
      themeSettings,
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
