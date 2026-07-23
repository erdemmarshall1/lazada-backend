const mongoose = require('mongoose');

const browseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
}, { timestamps: true });

browseHistorySchema.index({ userId: 1, createdAt: -1 });
browseHistorySchema.index({ userId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('BrowseHistory', browseHistorySchema);
