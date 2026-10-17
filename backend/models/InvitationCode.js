const mongoose = require('mongoose');

const invitationCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  usedAt: { type: Date, default: null },
  // Reusable until deactivated: track total uses and every shop that used it.
  usedCount: { type: Number, default: 0 },
  usedByShops: { type: [mongoose.Schema.Types.ObjectId], ref: 'Shop', default: [] },
}, { timestamps: true });

invitationCodeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('InvitationCode', invitationCodeSchema);
