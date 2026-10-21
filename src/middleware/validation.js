/**
 * Input validation + light bot pattern detection on inbound
 */

const { validateUrl } = require('../config/security');
const antiBot = require('../utils/antiBot');

function validateBypass(req, res, next) {
  const url = req.method === 'GET' ? req.query.url : (req.body && req.body.url);
  const check = validateUrl(url);
  if (!check.valid) {
    return res.status(400).json({
      success: false,
      error: check.error,
      code: check.code
    });
  }
  req.targetUrl = check.url;
  next();
}

function validateBatch(req, res, next) {
  const urls = req.body && req.body.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'urls array required',
      code: 'URL_REQUIRED'
    });
  }
  if (urls.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'Max 20 URLs per batch',
      code: 'INVALID_URL'
    });
  }
  const cleaned = [];
  for (const u of urls) {
    const c = validateUrl(u);
    if (c.valid) cleaned.push(c.url);
  }
  if (!cleaned.length) {
    return res.status(400).json({
      success: false,
      error: 'No valid URLs',
      code: 'INVALID_URL'
    });
  }
  req.targetUrls = cleaned;
  next();
}

function botPatternGate(req, res, next) {
  // Soft mode: log only; strict mode blocks
  const strict = process.env.STRICT_ANTIBOT === 'true';
  const result = antiBot.detectIncoming(req);
  if (result.isBot && strict) {
    return res.status(403).json({
      success: false,
      error: 'Request blocked',
      code: 'BLOCKED_DOMAIN',
      reasons: result.reasons
    });
  }
  req.botDetection = result;
  next();
}

module.exports = {
  validateBypass,
  validateBatch,
  botPatternGate
};
