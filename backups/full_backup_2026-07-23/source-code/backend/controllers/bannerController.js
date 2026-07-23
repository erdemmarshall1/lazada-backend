const Banner = require('../models/Banner');
const { success, fail } = require('../utils/response');

exports.getList = async (req, res) => {
  try {
    const list = await Banner.find({ status: 1 }).sort({ sort: 1 });
    res.json(success(list));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getActivityGoodsList = async (req, res) => {
  try {
    const banners = await Banner.find({ status: 1, position: 'home' }).sort({ sort: 1 });
    res.json(success(banners));
  } catch (error) {
    res.json(fail(error.message));
  }
};
