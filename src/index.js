// language: Node.js, file: src/index.js, target: Vercel/Docker/Local
'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const config = require('./config');
const logger = require('./utils/logger');
const { authMiddleware, rateLimiter, keyRateLimiter } = require('./middleware/auth');
const { validateUrl, validateBatch } = require('./middleware/validation');
const { createAntiBotMiddleware } = require('./middleware/antiBot');
const bypassHandler = require('./handlers/bypassHandler');
const turnstileHandler = require('./handlers/turnstileHandler');
const serviceDetector = require('./utils/serviceDetector');
const cacheManager = require('./utils/cache');
const updateChecker = require('./utils/updateChecker');
const serviceMonitor = require('./utils/serviceMonitor');
const { getStats } = require('./utils/antiBot');

const app = express();

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(config.security.cors));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Request ID injection ─────────────────────────────────────────────────────
app.use((req, _res, next) => {
  req.requestId = uuidv4();
  req.startTime = Date.now();
  next();
});

// ── Anti-bot + rate limiting ─────────────────────────────────────────────────
app.use('/api', createAntiBotMiddleware());
app.use('/api', rateLimiter);
app.use('/api', keyRateLimiter);

// ── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '3.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// ── Bypass endpoints ─────────────────────────────────────────────────────────
app.get('/api/bypass', authMiddleware, validateUrl, async (req, res) => {
  const { url } = req.query;
  try {
    const result = await bypassHandler.bypass(url, { requestId: req.requestId });
    res.json({ ...result, requestId: req.requestId, duration: Date.now() - req.startTime });
  } catch (err) {
    logger.error('Bypass GET error', { url, error: err.message, requestId: req.requestId });
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

app.post('/api/bypass', authMiddleware, validateUrl, async (req, res) => {
  const { url } = req.body;
  try {
    const result = await bypassHandler.bypass(url, { requestId: req.requestId });
    res.json({ ...result, requestId: req.requestId, duration: Date.now() - req.startTime });
  } catch (err) {
    logger.error('Bypass POST error', { url, error: err.message, requestId: req.requestId });
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

app.post('/api/bypass/batch', authMiddleware, validateBatch, async (req, res) => {
  const { urls } = req.body;
  try {
    const results = await bypassHandler.batchBypass(urls, { requestId: req.requestId });
    res.json({ success: true, results, requestId: req.requestId, duration: Date.now() - req.startTime });
  } catch (err) {
    logger.error('Batch bypass error', { error: err.message, requestId: req.requestId });
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

// ── Resolve / detect ─────────────────────────────────────────────────────────
app.get('/api/resolve', authMiddleware, validateUrl, async (req, res) => {
  const { url } = req.query;
  try {
    const { redirectResolver } = require('./utils/redirectResolver');
    const chain = await redirectResolver(url);
    res.json({ success: true, chain, final: chain[chain.length - 1], requestId: req.requestId });
  } catch (err) {
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

app.get('/api/detect', validateUrl, (req, res) => {
  const { url } = req.query;
  const detected = serviceDetector.detect(url);
  res.json({ success: true, url, service: detected, requestId: req.requestId });
});

// ── Services list ─────────────────────────────────────────────────────────────
app.get('/api/services', (_req, res) => {
  const services = require('./config/services');
  res.json({
    success: true,
    total: services.length,
    adlinks: services.filter(s => s.type === 'adlink').length,
    keySystems: services.filter(s => s.type === 'keysystem').length,
    services: services.map(s => ({ name: s.name, key: s.key, type: s.type, domains: s.domains }))
  });
});

// ── Stats ─────────────────────────────────────────────────────────────────────
app.get('/api/stats', authMiddleware, async (_req, res) => {
  const cache = await cacheManager.getStats();
  const antiBotStats = getStats();
  res.json({ success: true, cache, antiBot: antiBotStats, uptime: process.uptime() });
});

// ── Updates ───────────────────────────────────────────────────────────────────
app.get('/api/updates', authMiddleware, (_req, res) => {
  res.json(updateChecker.getStatus());
});

app.post('/api/updates/check', authMiddleware, async (_req, res) => {
  const result = await updateChecker.forceCheck();
  res.json(result);
});

// ── Turnstile ─────────────────────────────────────────────────────────────────
app.post('/api/turnstile/solve', authMiddleware, validateUrl, async (req, res) => {
  const { url, sitekey, pageurl } = req.body;
  if (typeof sitekey !== 'string' || !sitekey.trim() || sitekey.length > 512) return res.status(400).json({ success: false, error: 'A valid sitekey is required', code: 'INVALID_SITEKEY', requestId: req.requestId });
  if (pageurl && typeof pageurl !== 'string') return res.status(400).json({ success: false, error: 'pageurl must be a URL string', code: 'INVALID_PAGEURL', requestId: req.requestId });
  try {
    const result = await turnstileHandler.solve({ url, sitekey, pageurl });
    res.json({ ...result, requestId: req.requestId, duration: Date.now() - req.startTime });
  } catch (err) {
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

app.get('/api/turnstile/check', authMiddleware, validateUrl, async (req, res) => {
  const { url } = req.query;
  try {
    const result = await turnstileHandler.check(url);
    res.json({ success: true, ...result, requestId: req.requestId });
  } catch (err) {
    res.status(err.code === 'BLOCKED_DOMAIN' ? 400 : 502).json({ success: false, error: process.env.NODE_ENV === 'production' ? 'Request could not be completed' : err.message, code: err.code || 'REQUEST_FAILED', requestId: req.requestId });
  }
});

// ── Cache ─────────────────────────────────────────────────────────────────────
app.post('/api/cache/clear', authMiddleware, async (_req, res) => {
  await cacheManager.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  if (config.requireAuth && !config.apiKey) {
    logger.error('API_REQUIRE_AUTH is enabled but API_KEY is not configured');
    process.exitCode = 1;
    throw new Error('API_KEY must be configured when authentication is enabled');
  }
  const PORT = config.port || 3000;
  app.listen(PORT, () => {
    logger.info(`Bypass API v3.0.0 running on port ${PORT}`);
    serviceMonitor.start();
    updateChecker.start();
  });
}

module.exports = app;
