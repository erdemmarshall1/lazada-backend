const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'THE OUTNET WHOLESALE' },
  primaryColor: { type: String, default: '#000000' },
  backgroundColor: { type: String, default: '#ffffff' },
  textColor: { type: String, default: '#000000' },
  accentColor: { type: String, default: '#b8922a' },
  borderColor: { type: String, default: '#e6e6e6' },
  fontFamily: { type: String, default: 'TheOutnetWebXL, Arial' },
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
  customCSS: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
