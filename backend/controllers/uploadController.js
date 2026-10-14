const fs = require('fs');
const { success, fail } = require('../utils/response');
const cloudinary = require('../config/cloudinary');
const config = require('../config/app');

const cloudinaryReady = () =>
  !!(config.CLOUDINARY_CLOUD_NAME && config.CLOUDINARY_API_KEY && config.CLOUDINARY_API_SECRET);

exports.file = async (req, res) => {
  try {
    if (!req.file) return res.json(fail('No file uploaded'));

    if (cloudinaryReady()) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'uploads',
          resource_type: 'auto',
        });
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.json(success({ url: result.secure_url, filename: result.public_id }));
      } catch (err) {
        console.error('Cloudinary upload failed, falling back to local storage:', err.message);
      }
    }

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
