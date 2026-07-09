const SystemSettings = require('../models/SystemSettings');
const { success, fail } = require('../utils/response');

const getOrCreate = async () => {
  let settings = await SystemSettings.findOne();
  if (!settings) {
    settings = await SystemSettings.create({});
  }
  return settings;
};

exports.getTheme = async (req, res) => {
  try {
    const settings = await getOrCreate();
    res.json(success(settings));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.updateTheme = async (req, res) => {
  try {
    const allowed = [
      'siteName', 'primaryColor', 'backgroundColor', 'textColor',
      'accentColor', 'borderColor', 'fontFamily', 'logoUrl', 'faviconUrl', 'customCSS',
      'smsEnabled', 'smsFrom', 'pushEnabled',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    const settings = await getOrCreate();
    Object.assign(settings, updates);
    await settings.save();
    res.json(success(settings, 'Theme settings updated'));
  } catch (error) {
    res.json(fail(error.message));
  }
};
