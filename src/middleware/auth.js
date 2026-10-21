'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

function authMiddleware(req, res, next) {
  if (!config.requireAuth) return next();
  if (!config.apiKey || config.apiKey === 'your-secret-api-key-here') {
    return res.status(503).json({ success: false, error: 'API authentication is not configured', code: 'AUTH_NOT_CONFIGURED' });
  }
  // Accept credentials only in headers; query strings commonly leak into logs.
  const key = req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key || key !== config.apiKey) {
    return res.status(401).json({ success: false, error: 'Invalid or missing API key', code: 'API_KEY_REQUIRED' });
  }
  next();
}

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success: false, error: 'Too many requests', code: 'RATE_LIMITED' })
});

const keyRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.key,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => req.get('x-api-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '') || req.ip,
  handler: (_req, res) => res.status(429).json({ success: false, error: 'API key rate limit exceeded', code: 'KEY_RATE_LIMITED' })
});

module.exports = { authMiddleware, rateLimiter, keyRateLimiter };
