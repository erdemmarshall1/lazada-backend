const mongoose = require('mongoose');

const chatwootSettingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  websiteToken: { type: String, default: '' },
  baseUrl: { type: String, default: 'https://app.chatwoot.com' },
}, { timestamps: true });

module.exports = mongoose.model('ChatwootSetting', chatwootSettingSchema);
