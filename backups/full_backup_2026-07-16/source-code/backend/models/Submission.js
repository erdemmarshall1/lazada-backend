const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true, default: '' },
  subject: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['general', 'order', 'product', 'refund', 'shipping', 'partnership', 'press', 'other'],
    default: 'general',
  },
  message: { type: String, required: true },
  attachments: [{ type: String }],
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new',
  },
  adminNotes: { type: String, default: '' },
  repliedAt: { type: Date },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

submissionSchema.index({ status: 1, createdAt: -1 });
submissionSchema.index({ userId: 1, createdAt: -1 });
submissionSchema.index({ email: 1 });

module.exports = mongoose.model('Submission', submissionSchema);