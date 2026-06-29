const express = require('express');
const router = express.Router();
const AppVersion = require('../models/appVersion.model');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });
const ciLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

function isAllowedDownloadUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'github.com';
  } catch {
    return false;
  }
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
router.get('/app-version', publicLimiter, async (req, res) => {
  try {
    const platform = String(req.query.platform || 'android');
    const version = await AppVersion.findOne({ platform });
    if (!version) return res.status(404).json({ message: 'No version info found' });
    res.json(version);
  } catch (err) {
    console.error('[appVersion error GET]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/app-version', ciLimiter, async (req, res) => {
  const ciSecret = req.headers['x-ci-secret'];
  if (!ciSecret || !process.env.CI_UPDATE_SECRET || !safeEqual(ciSecret, process.env.CI_UPDATE_SECRET)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { buildNumber, versionName, downloadUrl, releaseNotes, platform } = req.body;
  if (!buildNumber || !versionName || !downloadUrl) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  if (!Number.isInteger(buildNumber) || buildNumber <= 0) {
    return res.status(400).json({ message: 'buildNumber must be a positive integer' });
  }
  if (typeof versionName !== 'string' || !/^\d+\.\d+\.\d+$/.test(versionName)) {
    return res.status(400).json({ message: 'versionName must look like 1.2.3' });
  }
  if (!isAllowedDownloadUrl(downloadUrl)) {
    return res.status(400).json({ message: 'downloadUrl must be an https GitHub URL' });
  }
  
  const notes = typeof releaseNotes === 'string' ? releaseNotes.slice(0, 500) : '';
  const platformStr = String(platform || 'android');

  try {
    const existing = await AppVersion.findOne({ platform: platformStr });
    const update = { buildNumber, versionName, downloadUrl, releaseNotes: notes, updatedAt: new Date() };

    const updated = await AppVersion.findOneAndUpdate(
      { platform: platformStr },
      update,
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    console.error('[appVersion error POST]', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/download/android', publicLimiter, async (req, res) => {
  try {
    const version = await AppVersion.findOne({ platform: 'android' });
    if (!version || !isAllowedDownloadUrl(version.downloadUrl)) return res.status(404).send('No build available yet');
    res.redirect(302, version.downloadUrl);
  } catch (err) {
    console.error('[appVersion error DOWNLOAD]', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
