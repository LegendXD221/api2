'use strict';

module.exports = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiKey: process.env.API_KEY || null,
  // Fail closed in production; local development remains convenient.
  requireAuth: process.env.API_REQUIRE_AUTH === 'true' ||
    (process.env.NODE_ENV === 'production' && process.env.API_REQUIRE_AUTH !== 'false'),
  puppeteerEnabled: process.env.PUPPETEER_ENABLED === 'true',

  rateLimit: {
    ip: parseInt(process.env.API_RATE_LIMIT) || 100,
    key: parseInt(process.env.API_KEY_RATE_LIMIT) || 500,
    windowMs: 60 * 1000
  },

  cache: {
    successTtl: 3600,       // 1 hour
    failureTtl: 300,        // 5 minutes
    turnstileTtl: 300,      // 5 minutes
    servicesTtl: 86400      // 24 hours
  },

  request: {
    timeout: 12000,
    retries: 3,
    retryDelays: [1000, 2000, 4000],
    maxRedirects: 10
  },

  stealth: {
    userAgentRotation: process.env.STEALTH_USER_AGENT_ROTATION !== 'false',
    headerOrderRandomization: process.env.STEALTH_HEADER_ORDER_RANDOMIZATION !== 'false'
  },

  captcha: {
    twoCaptchaKey: process.env.TWOCAPTCHA_API_KEY || null,
    antiCaptchaKey: process.env.ANTICAPTCHA_API_KEY || null,
    capsolverKey: process.env.CAPSOLVER_API_KEY || null
  },

  turnstile: {
    proxy1Url: process.env.TURNSTILE_PROXY_1_URL || null,
    proxy1Key: process.env.TURNSTILE_PROXY_1_KEY || null
  },

  redis: {
    url: process.env.REDIS_URL || null
  },

  security: {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
    }
  },

  updates: {
    checkInterval: 6 * 60 * 60 * 1000,  // 6 hours
    enabled: true
  },

  concurrency: {
    default: 10,
    batch: 5
  }
};
