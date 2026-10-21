'use strict';
const { MAX_URL_LENGTH, MAX_BATCH_SIZE } = require('../config/security');
const { validatePublicUrl } = require('../utils/urlSecurity');
function checkUrl(url) {
  if (typeof url !== 'string' || !url.trim() || url.length > MAX_URL_LENGTH) return { message: 'URL is too long or invalid', code: 'INVALID_URL' };
  return validatePublicUrl(url);
}
function validateUrl(req, res, next) {
  const url = req.query.url || req.body?.url;
  if (!url) return res.status(400).json({ success: false, error: 'URL is required', code: 'URL_REQUIRED' });
  const result = checkUrl(url);
  if (!result.ok) return res.status(400).json({ success: false, error: result.message, code: result.code });
  req.query.url = result.url;
  if (req.body) req.body.url = result.url;
  next();
}
function validateBatch(req, res, next) {
  const urls = req.body?.urls;
  if (!Array.isArray(urls) || !urls.length) return res.status(400).json({ success: false, error: 'urls must be a non-empty array', code: 'URL_REQUIRED' });
  if (urls.length > MAX_BATCH_SIZE) return res.status(400).json({ success: false, error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE}`, code: 'BATCH_TOO_LARGE' });
  for (const url of urls) {
    const result = checkUrl(url);
    if (!result.ok) return res.status(400).json({ success: false, error: `${String(url).slice(0, 100)}: ${result.message}`, code: result.code });
  }
  req.body.urls = urls.map(url => validatePublicUrl(url).url);
  next();
}
module.exports = { validateUrl, validateBatch, checkUrl };
