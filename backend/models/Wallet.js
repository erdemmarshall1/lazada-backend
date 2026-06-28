const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalRecharge: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  status: { type: Number, enum: [0, 1], default: 1 },
}, { timestamps: true });

let _io = null;
walletSchema.statics.setIO = (io) => { _io = io; };

walletSchema.post('save', function () {
  if (_io && this.isModified('balance')) {
    _io.to(`user_${this.userId}`).emit('walletUpdated', { balance: this.balance });
  }
});

module.exports = mongoose.model('Wallet', walletSchema);
