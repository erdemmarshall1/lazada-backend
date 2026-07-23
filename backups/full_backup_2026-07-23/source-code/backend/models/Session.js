const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  device: { type: String, default: '' },
  ip: { type: String, default: '' },
  lastActivity: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

sessionSchema.index({ userId: 1, isActive: 1 });
sessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

module.exports = mongoose.model('Session', sessionSchema);
