const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'image', 'system', 'kefu', 'internal'], default: 'text' },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  sessionId: { type: String },
}, { timestamps: true });

messageSchema.index({ sessionId: 1 });
messageSchema.index({ fromUserId: 1, toUserId: 1 });
messageSchema.index({ shopId: 1 });
messageSchema.index({ isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
