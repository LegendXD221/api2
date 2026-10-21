'use strict';

const { detectBot, applyEvasion } = require('../utils/antiBot');
const logger = require('../utils/logger');

// Base: inject evasion headers into outgoing requests (response-side)
function antiBotMiddleware(req, _res, next) {
  req._antiBotLevel = 'medium';
  next();
}

// Strict: block detected bots
function strictAntiBotMiddleware(req, res, next) {
  const detection = detectBot(req);
  if (detection.isBot) {
    logger.warn(`[AntiBot] Bot blocked: reason=${detection.reason} ip=${req.ip}`);
    return res.status(403).json({ success: false, error: 'Forbidden', code: 'BOT_DETECTED' });
  }
  next();
}

// Adds security headers to responses
function antiBotResponseMiddleware(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}

// Monitoring — track request counts
function antiBotMonitoringMiddleware(req, _res, next) {
  // Could push to stats here; kept lightweight
  next();
}

// Combined factory — used in index.js
function createAntiBotMiddleware({ strict = false } = {}) {
  return [
    antiBotMonitoringMiddleware,
    antiBotResponseMiddleware,
    antiBotMiddleware,
    ...(strict ? [strictAntiBotMiddleware] : [])
  ];
}

module.exports = {
  antiBotMiddleware,
  strictAntiBotMiddleware,
  antiBotResponseMiddleware,
  antiBotMonitoringMiddleware,
  createAntiBotMiddleware
};
