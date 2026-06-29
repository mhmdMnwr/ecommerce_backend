const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
  platform: { type: String, default: 'android', unique: true },
  buildNumber: { type: Number, required: true },

  versionName: { type: String, required: true },
  downloadUrl: { type: String, required: true },
  releaseNotes: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AppVersion', appVersionSchema);
