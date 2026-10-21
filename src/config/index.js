/**
 * Configuration loader with validation
 */

require('dotenv').config();

const { countByType } = require('./services');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || null,
  requireAuth: process.env.API_REQUIRE_AUTH === 'true',
  rateLimit: parseInt(process.env.API_RATE_LIMIT || '100', 10),
  keyRateLimit: parseInt(process.env.API_KEY_RATE_LIMIT || '500', 10),

  puppeteerEnabled: process.env.PUPPETEER_ENABLED === 'true',

  captcha: {
    twoCaptcha: process.env.TWOCAPTCHA_API_KEY || null,
    antiCaptcha: process.env.ANTICAPTCHA_API_KEY || null,
    capsolver: process.env.CAPSOLVER_API_KEY || null
  },

  redis: {
    url: process.env.REDIS_URL || null
  },

  stealth: {
    userAgentRotation: process.env.STEALTH_USER_AGENT_ROTATION !== 'false',
    headerOrderRandomization: process.env.STEALTH_HEADER_ORDER_RANDOMIZATION !== 'false'
  },

  turnstileProxies: [
    {
      url: process.env.TURNSTILE_PROXY_1_URL || null,
      key: process.env.TURNSTILE_PROXY_1_KEY || null
    }
  ].filter(p => p.url),

  cache: {
    successTtl: 3600,      // 1h
    failureTtl: 300,       // 5min
    turnstileTtl: 300,     // 5min
    serviceTtl: 86400      // 24h
  },

  concurrency: parseInt(process.env.CONCURRENCY || '15', 10),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '15000', 10),
  maxBatch: 20,

  services: countByType()
};

function validateConfig() {
  const warnings = [];
  if (config.requireAuth && !config.apiKey) {
    warnings.push('API_REQUIRE_AUTH=true but API_KEY not set');
  }
  if (!config.captcha.twoCaptcha && !config.captcha.antiCaptcha && !config.captcha.capsolver) {
    warnings.push('No external CAPTCHA solver keys configured — internal/manual fallback only');
  }
  return warnings;
}

module.exports = {
  config,
  validateConfig
};
