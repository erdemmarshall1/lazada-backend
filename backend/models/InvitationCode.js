const mongoose = require('mongoose');

const invitationCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isActive: { type: Boolean, default: true },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  usedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('InvitationCode', invitationCodeSchema);
