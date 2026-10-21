/**
 * Anti-bot middleware stack
 */

const antiBot = require('../utils/antiBot');

function antiBotMiddleware(req, res, next) {
  // Inject evasion level preference if client asked
  const level = (req.headers['x-evasion-level'] || req.query.level || 'medium').toLowerCase();
  req.evasionLevel = ['low', 'medium', 'high', 'maximum'].includes(level) ? level : 'medium';
  next();
}

function strictAntiBotMiddleware(req, res, next) {
  const result = antiBot.detectIncoming(req);
  if (result.isBot) {
    return res.status(403).json({
      success: false,
      error: 'Bot request blocked',
      code: 'BLOCKED_DOMAIN',
      reasons: result.reasons
    });
  }
  next();
}

function antiBotResponseMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

function antiBotMonitoringMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    // stats already tracked inside antiBot.evade on outbound
  });
  next();
}

function createAntiBotMiddleware({ strict = false } = {}) {
  return [
    antiBotMiddleware,
    strict ? strictAntiBotMiddleware : (req, res, next) => next(),
    antiBotResponseMiddleware,
    antiBotMonitoringMiddleware
  ];
}

module.exports = {
  antiBotMiddleware,
  strictAntiBotMiddleware,
  antiBotResponseMiddleware,
  antiBotMonitoringMiddleware,
  createAntiBotMiddleware
};
