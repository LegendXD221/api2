/**
 * Security validations, rate limits, CORS
 */

const rateLimit = require('express-rate-limit');

const DEFAULT_RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '100', 10);
const KEY_RATE_LIMIT = parseInt(process.env.API_KEY_RATE_LIMIT || '500', 10);

const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: DEFAULT_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests',
    code: 'RATE_LIMITED'
  },
  keyGenerator: (req) => req.ip || req.headers['x-forwarded-for'] || 'unknown'
});

const keyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: KEY_RATE_LIMIT,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'API key rate limit exceeded',
    code: 'RATE_LIMITED'
  },
  keyGenerator: (req) => {
    const key = req.headers['x-api-key'] || req.query.api_key || 'anonymous';
    return `key:${key}`;
  }
});

const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization'],
  maxAge: 86400
};

function isValidApiKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.length < 16 || key.length > 128) return false;
  return /^[a-zA-Z0-9_\-]+$/.test(key);
}

function validateUrl(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, code: 'URL_REQUIRED', error: 'URL is required' };
  }
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    return { valid: false, code: 'INVALID_URL', error: 'Malformed URL' };
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    return { valid: false, code: 'INVALID_URL', error: 'Only http/https allowed' };
  }
  if (url.hostname.length < 3 || url.hostname.length > 253) {
    return { valid: false, code: 'INVALID_URL', error: 'Invalid hostname' };
  }
  // Block obvious internal / localhost
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.', '10.', '192.168.'];
  if (blocked.some(b => url.hostname.includes(b) || url.hostname.startsWith(b))) {
    return { valid: false, code: 'BLOCKED_DOMAIN', error: 'Domain is blocked' };
  }
  return { valid: true, url: url.href };
}

module.exports = {
  ipLimiter,
  keyLimiter,
  corsOptions,
  isValidApiKey,
  validateUrl,
  DEFAULT_RATE_LIMIT,
  KEY_RATE_LIMIT
};
