const mongoose = require('mongoose');

const backupActivitySchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['backup_zip', 'backup_json', 'backup_server', 'restore', 'maintenance_on', 'maintenance_off'],
    required: true,
  },
  actor: { type: String, default: '' },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  filename: { type: String, default: '' },
  filePath: { type: String, default: '' },
  sizeMB: { type: Number, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['ok', 'error'], default: 'ok' },
  error: { type: String, default: '' },
}, { timestamps: true });

backupActivitySchema.index({ createdAt: -1 });
backupActivitySchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('BackupActivity', backupActivitySchema);
