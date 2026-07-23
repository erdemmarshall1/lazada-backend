const mongoose = require('mongoose');

const liveChatSettingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  widgetTitle: { type: String, default: 'Live Chat' },
  widgetColor: { type: String, default: '#165dff' },
  widgetPosition: { type: String, enum: ['bottom-right', 'bottom-left'], default: 'bottom-right' },
  autoGreeting: { type: String, default: 'Hello! How can we help you today?' },
  offlineMessage: { type: String, default: 'Our team is offline. Leave a message and we\'ll get back to you.' },
  agentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('LiveChatSetting', liveChatSettingSchema);
