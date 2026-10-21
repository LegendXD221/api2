/**
 * Auth + rate-limit wiring
 */

const { config } = require('../config');
const { isValidApiKey, ipLimiter, keyLimiter } = require('../config/security');

function authMiddleware(req, res, next) {
  if (!config.requireAuth) return next();

  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) {
    return res.status(401).json({
      success: false,
      error: 'API key required',
      code: 'API_KEY_REQUIRED'
    });
  }
  if (!isValidApiKey(key)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  if (config.apiKey && key !== config.apiKey) {
    // allow multiple keys later; for now single shared secret
    return res.status(401).json({
      success: false,
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  req.apiKey = key;
  next();
}

function rateLimitStack(req, res, next) {
  // IP first, then key if present
  ipLimiter(req, res, (err) => {
    if (err) return next(err);
    if (req.headers['x-api-key'] || req.query.api_key) {
      return keyLimiter(req, res, next);
    }
    next();
  });
}

module.exports = {
  authMiddleware,
  rateLimitStack
};
