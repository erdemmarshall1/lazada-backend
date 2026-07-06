const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  method: { type: String, enum: ['password', '2fa', 'backup_code', 'register', 'reset'], default: 'password' },
  success: { type: Boolean, default: true },
  location: { type: String, default: '' },
}, { timestamps: true });

loginHistorySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
