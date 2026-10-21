'use strict';

const pLimit = require('p-limit');
const serviceDetector = require('../utils/serviceDetector');
const serviceHandlers = require('./serviceHandlers');
const turnstileHandler = require('./turnstileHandler');
const cache = require('../utils/cache');
const { buildEvasionHeaders, behavioralDelay } = require('../utils/antiBot');
const { redirectResolver } = require('../utils/redirectResolver');
const logger = require('../utils/logger');
const config = require('../config');
const serviceMonitor = require('../utils/serviceMonitor');
const { assertPublicUrl } = require('../utils/urlSecurity');

const limiter = pLimit(config.concurrency.default);
const batchLimiter = pLimit(config.concurrency.batch);

async function bypass(url, opts = {}) {
  url = await assertPublicUrl(url);
  const { requestId = 'unknown' } = opts;

  // Cache check
  const cached = await cache.getBypass(url);
  if (cached) {
    logger.debug(`[BypassHandler] Cache hit for ${url}`);
    return { ...cached, cached: true };
  }

  return limiter(async () => {
    // Detect service
    const detected = serviceDetector.detect(url);
    if (!detected) {
      // Unknown service — try direct redirect resolution
      const chain = await redirectResolver(url);
      const destination = chain[chain.length - 1];
      const result = {
        success: true,
        destination,
        originalUrl: url,
        resolvedUrl: url,
        service: null,
        method: 'redirect_resolve',
        status: 200
      };
      await cache.setBypass(url, result);
      return result;
    }

    const svc = serviceDetector.getService(detected.key);
    if (!svc) throw new Error(`Service config not found for key: ${detected.key}`);

    // Health gate
    if (!serviceMonitor.isHealthy(svc.key)) {
      logger.warn(`[BypassHandler] Service ${svc.name} flagged as unhealthy`);
    }

    logger.info(`[BypassHandler] Bypassing ${svc.name} (${svc.bypass.method}) url=${url} rid=${requestId}`);

    let result;
    try {
      // Turnstile pre-check for flagged services
      if (svc.hasTurnstile) {
        const tsCheck = await turnstileHandler.check(url);
        if (tsCheck.hasTurnstile && tsCheck.sitekey) {
          logger.debug(`[BypassHandler] Turnstile detected on ${url}`);
          const token = await turnstileHandler.solve({ url, sitekey: tsCheck.sitekey, pageurl: url });
          if (token.success) {
            result = await serviceHandlers.bypassWithToken(svc, url, token.token);
          }
        }
      }

      // Main handler dispatch
      if (!result) {
        result = await serviceHandlers.dispatch(svc, url);
      }
    } catch (err) {
      logger.error(`[BypassHandler] Error on ${svc.name}: ${err.message}`);
      const failResult = { success: false, error: err.message, originalUrl: url, service: detected };
      await cache.setBypassFail(url, failResult);
      return failResult;
    }

    const final = {
      success: true,
      destination: result.destination,
      originalUrl: url,
      resolvedUrl: result.resolvedUrl || url,
      service: { name: svc.name, key: svc.key, type: svc.type, isCanonical: detected.isCanonical },
      method: result.method || svc.bypass.method,
      status: result.status || 200,
      cached: false
    };

    await cache.setBypass(url, final);
    return final;
  });
}

async function batchBypass(urls, opts = {}) {
  if (!Array.isArray(urls)) throw new Error('urls must be an array');
  return Promise.all(urls.map(url => batchLimiter(() => bypass(url, opts).catch(err => ({
    success: false, url, error: err.message
  })))));
}

async function bypassWithTurnstileToken(svc, url, token) {
  return serviceHandlers.bypassWithToken(svc, url, token);
}

module.exports = { bypass, batchBypass, bypassWithTurnstileToken };
