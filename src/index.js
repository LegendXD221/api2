/**
 * Bypass API v3.0.0 — entry
 * Node 18+, Express, production-ready
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const { config, validateConfig } = require('./config');
const { corsOptions } = require('./config/security');
const { authMiddleware, rateLimitStack } = require('./middleware/auth');
const { validateBypass, validateBatch, botPatternGate } = require('./middleware/validation');
const { createAntiBotMiddleware } = require('./middleware/antiBot');
const { bypassUrl, bypassBatch } = require('./handlers/bypassHandler');
const { checkForTurnstile, solveTurnstile } = require('./handlers/turnstileHandler');
const { detect } = require('./utils/serviceDetector');
const { resolve } = require('./utils/redirectResolver');
const { listServices, countByType } = require('./config/services');
const cache = require('./utils/cache');
const captchaSolver = require('./utils/captchaSolver');
const antiBot = require('./utils/antiBot');
const serviceUpdater = require('./config/updates/serviceUpdater');
const updateChecker = require('./utils/updateChecker');
const serviceMonitor = require('./utils/serviceMonitor');
const logger = require('./utils/logger');
const { refreshAliases } = require('./config/aliases');
const { refreshLockerHosts } = require('./utils/lockerHosts');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions));
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// Global stack
app.use(rateLimitStack);
app.use(botPatternGate);
app.use(...createAntiBotMiddleware({ strict: false }));
app.use(authMiddleware);

// Request id
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
});

// ---------- Routes ----------

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    uptime: process.uptime(),
    services: countByType(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/services', (req, res) => {
  res.json({
    success: true,
    count: countByType(),
    services: listServices()
  });
});

app.get('/api/detect', (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ success: false, error: 'url required', code: 'URL_REQUIRED' });
  }
  const result = detect(url);
  res.json({ success: true, ...result, requestId: req.requestId });
});

app.get('/api/resolve', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ success: false, error: 'url required', code: 'URL_REQUIRED' });
  }
  try {
    const result = await resolve(url, {
      maxHops: 8,
      level: req.evasionLevel || 'medium'
    });
    res.json({
      success: result.success,
      ...result,
      requestId: req.requestId
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: 'NETWORK_ERROR',
      requestId: req.requestId
    });
  }
});

app.get('/api/bypass', validateBypass, async (req, res) => {
  try {
    const result = await bypassUrl(req.targetUrl, {
      requestId: req.requestId,
      level: req.evasionLevel || 'medium'
    });
    res.status(result.success ? 200 : 422).json(result);
  } catch (err) {
    logger.error('bypass GET failed', { error: err.message, id: req.requestId });
    res.status(500).json({
      success: false,
      error: err.message,
      code: 'NETWORK_ERROR',
      requestId: req.requestId
    });
  }
});

app.post('/api/bypass', validateBypass, async (req, res) => {
  try {
    const result = await bypassUrl(req.targetUrl, {
      requestId: req.requestId,
      level: req.evasionLevel || req.body.level || 'medium',
      noCache: !!req.body.noCache
    });
    res.status(result.success ? 200 : 422).json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: 'NETWORK_ERROR',
      requestId: req.requestId
    });
  }
});

app.post('/api/bypass/batch', validateBatch, async (req, res) => {
  try {
    const result = await bypassBatch(req.targetUrls, {
      level: req.evasionLevel || req.body.level || 'medium'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      code: 'NETWORK_ERROR',
      requestId: req.requestId
    });
  }
});

app.get('/api/turnstile/check', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ success: false, error: 'url required', code: 'URL_REQUIRED' });
  }
  const result = await checkForTurnstile(url, { level: req.evasionLevel || 'medium' });
  res.json({ success: true, ...result, requestId: req.requestId });
});

app.post('/api/turnstile/solve', async (req, res) => {
  const { url, sitekey, pageurl } = req.body || {};
  if (!sitekey && !url) {
    return res.status(400).json({
      success: false,
      error: 'sitekey or url required',
      code: 'URL_REQUIRED'
    });
  }
  const result = await solveTurnstile({
    url,
    sitekey,
    pageurl: pageurl || url,
    level: req.evasionLevel || 'high'
  });
  res.status(result.success ? 200 : 422).json({ ...result, requestId: req.requestId });
});

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    cache: cache.stats(),
    captcha: captchaSolver.getStats(),
    antiBot: antiBot.getStats(),
    concurrency: { active: 0 }, // live gate is internal
    services: countByType(),
    requestId: req.requestId
  });
});

app.get('/api/updates', async (req, res) => {
  const status = serviceUpdater.status();
  res.json({ success: true, ...status, requestId: req.requestId });
});

app.post('/api/updates/check', async (req, res) => {
  const result = await serviceUpdater.check();
  res.json({ success: true, ...result, requestId: req.requestId });
});

app.post('/api/cache/clear', async (req, res) => {
  await cache.clear();
  res.json({ success: true, cleared: true, requestId: req.requestId });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    code: 'NOT_FOUND'
  });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: 'Internal error',
    code: 'NETWORK_ERROR',
    requestId: req.requestId
  });
});

async function start() {
  const warnings = validateConfig();
  warnings.forEach(w => logger.warn(w));

  refreshAliases();
  refreshLockerHosts();
  await cache.init();

  if (!process.env.VERCEL) {
    updateChecker.start();
    serviceMonitor.start();
    app.listen(config.port, () => {
      logger.info(`Bypass API v3.0.0 listening on :${config.port}`, {
        services: countByType(),
        env: config.nodeEnv
      });
    });
  }
}

// Vercel / serverless export
module.exports = app;

if (require.main === module) {
  start().catch(err => {
    logger.error('Failed to start', { error: err.message });
    process.exit(1);
  });
}
