const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['product', 'shop'], required: true },
}, { timestamps: true });

favoriteSchema.index({ userId: 1, targetId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
