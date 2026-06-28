const { success } = require('../utils/response');

exports.getAlertList = async (req, res) => {
  res.json(success([]));
};
