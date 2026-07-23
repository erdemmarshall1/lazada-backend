const mongoose = require('mongoose');

const tawkToSettingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  widgetId: { type: String, default: '' },
  widgetPosition: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
  widgetColor: { type: String, default: '#ff6600' },
}, { timestamps: true });

module.exports = mongoose.model('TawkToSetting', tawkToSettingSchema);
