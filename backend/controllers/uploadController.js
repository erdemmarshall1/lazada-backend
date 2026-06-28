const { success, fail } = require('../utils/response');

exports.file = async (req, res) => {
  try {
    if (!req.file) return res.json(fail('No file uploaded'));
    const url = `/uploads/${req.file.filename}`;
    res.json(success({ url, filename: req.file.filename }));
  } catch (error) {
    res.json(fail(error.message));
  }
};

exports.getSts = async (req, res) => {
  res.json(success({
    accessKeyId: 'local',
    accessKeySecret: 'local',
    bucket: 'local',
    region: 'local',
    endpoint: '/uploads',
  }));
};
