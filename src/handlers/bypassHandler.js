/**
 * Main bypass pipeline
 * detect → alias rewrite → cache → local service → multi-hop deepen → upstream → fail
 * Success requires destination different from input and preferably non-locker host
 */

const { v4: uuidv4 } = require('uuid');
const { detect } = require('../utils/serviceDetector');
const cache = require('../utils/cache');
const { config } = require('../config');
const { bypassByService } = require('./serviceHandlers');
const { checkForTurnstile, solveTurnstile } = require('./turnstileHandler');
const { resolve } = require('../utils/redirectResolver');
const { getServiceByKey } = require('../config/services');
const { tryUpstream } = require('../utils/upstreamBypass');
const {
  isFinalDestination,
  isSameOrLocker,
  isLockerHost
} = require('../utils/lockerHosts');
const logger = require('../utils/logger');

const active = new Map();

async function withConcurrency(fn) {
  while (active.size >= config.concurrency) {
    await new Promise(r => setTimeout(r, 50));
  }
  const id = uuidv4();
  active.set(id, Date.now());
  try {
    return await fn();
  } finally {
    active.delete(id);
  }
}

function normalizeResult(result, rawUrl, workUrl) {
  if (!result || !result.success || !result.destination) {
    return {
      success: false,
      error: result?.error || 'Bypass failed',
      code: result?.code || 'SERVICE_UNAVAILABLE',
      destination: null
    };
  }
  if (isSameOrLocker(result.destination, rawUrl) || isSameOrLocker(result.destination, workUrl)) {
    return {
      success: false,
      error: 'Resolved to same or locker URL',
      code: 'SERVICE_UNAVAILABLE',
      destination: result.destination,
      method: result.method
    };
  }
  return {
    ...result,
    success: true,
    isFinal: isFinalDestination(result.destination)
  };
}

async function bypassUrl(rawUrl, options = {}) {
  const requestId = options.requestId || uuidv4();
  const started = Date.now();
  const level = options.level || 'medium';

  const detection = detect(rawUrl);
  const workUrl = detection.resolvedUrl || detection.url || rawUrl;

  const cacheKey = `bypass:v3:${workUrl}`;
  if (!options.noCache) {
    const hit = await cache.get(cacheKey);
    if (hit && hit.success && hit.destination && !isSameOrLocker(hit.destination, workUrl)) {
      return {
        ...hit,
        cached: true,
        requestId,
        duration: Date.now() - started,
        timestamp: new Date().toISOString()
      };
    }
  }

  return withConcurrency(async () => {
    try {
      let turnstileInfo = null;
      const svc = detection.service;
      const serviceCfg = svc ? getServiceByKey(svc.key) : null;

      if (svc && (options.forceTurnstile || serviceCfg?.hasTurnstile)) {
        try {
          const check = await checkForTurnstile(workUrl, { level: 'high' });
          if (check.present && check.sitekey) {
            const solved = await solveTurnstile({
              url: workUrl,
              sitekey: check.sitekey,
              pageurl: workUrl,
              level: 'high'
            });
            if (solved.success) {
              turnstileInfo = {
                solved: true,
                token: solved.token,
                sitekey: solved.sitekey,
                solver: solved.solver,
                method: solved.method
              };
            }
          }
        } catch (e) {
          logger.debug('Turnstile skipped', { error: e.message });
        }
      }

      let result = null;

      // 1) Service-specific / direct
      if (svc) {
        result = await bypassByService(workUrl, svc.key, {
          level,
          turnstileToken: turnstileInfo?.token
        });
        result = normalizeResult(result, rawUrl, workUrl);
      }

      // 2) Pure multi-hop if service path failed or unknown
      if (!result?.success) {
        const resolved = await resolve(workUrl, { maxHops: 10, level });
        if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, workUrl)) {
          result = normalizeResult(
            {
              success: true,
              destination: resolved.finalUrl,
              method: 'resolve_only',
              chain: resolved.chain,
              hops: resolved.hops,
              status: resolved.status
            },
            rawUrl,
            workUrl
          );
        }
      }

      // 3) Upstream providers (env BYPASS_UPSTREAM_URLS)
      if (!result?.success) {
        const up = await tryUpstream(workUrl);
        if (up.success) {
          result = normalizeResult(
            {
              success: true,
              destination: up.destination,
              method: up.method,
              provider: up.provider
            },
            rawUrl,
            workUrl
          );
        }
      }

      // 4) Last chance: if we have a locker intermediate, one more deepen
      if (result?.success && result.destination && isLockerHost(new URL(result.destination).hostname)) {
        const again = await resolve(result.destination, { maxHops: 6, level });
        if (again.success && again.finalUrl && isFinalDestination(again.finalUrl)) {
          result.destination = again.finalUrl;
          result.method = (result.method || '') + '+deepen';
          result.isFinal = true;
        } else {
          // still locker — do not claim full success as final, but return hop if different
          if (isSameOrLocker(result.destination, workUrl)) {
            result = {
              success: false,
              error: 'Stuck on locker URL',
              code: 'SERVICE_UNAVAILABLE',
              destination: result.destination
            };
          }
        }
      }

      const payload = {
        success: !!result?.success,
        destination: result?.destination || null,
        originalUrl: rawUrl,
        resolvedUrl: workUrl,
        service: svc || null,
        method: result?.method || 'unknown',
        isFinal: result?.isFinal ?? (result?.destination ? isFinalDestination(result.destination) : false),
        status: result?.status || null,
        chain: result?.chain,
        hops: result?.hops,
        provider: result?.provider,
        cached: false,
        requestId,
        duration: Date.now() - started,
        timestamp: new Date().toISOString()
      };

      if (detection.alias) payload.alias = detection.alias;
      if (turnstileInfo) payload.turnstile = turnstileInfo;
      if (!payload.success) {
        payload.error = result?.error || 'Bypass failed';
        payload.code = result?.code || 'SERVICE_UNAVAILABLE';
      }

      if (!options.noCache && payload.success && payload.destination) {
        await cache.set(cacheKey, payload, config.cache.successTtl);
      } else if (!options.noCache && !payload.success) {
        await cache.set(cacheKey, payload, config.cache.failureTtl);
      }

      return payload;
    } catch (err) {
      logger.error('Bypass error', { requestId, error: err.message });
      return {
        success: false,
        error: err.message,
        code: 'NETWORK_ERROR',
        originalUrl: rawUrl,
        resolvedUrl: workUrl,
        destination: null,
        requestId,
        duration: Date.now() - started,
        timestamp: new Date().toISOString()
      };
    }
  });
}

async function bypassBatch(urls, options = {}) {
  const list = (urls || []).slice(0, config.maxBatch);
  const results = await Promise.all(
    list.map(u => bypassUrl(u, { ...options, requestId: uuidv4() }))
  );
  return {
    success: true,
    count: results.length,
    results
  };
}

async function bypassWithTurnstileToken(rawUrl, token, options = {}) {
  return bypassUrl(rawUrl, {
    ...options,
    forceTurnstile: false,
    turnstileToken: token
  });
}

module.exports = {
  bypassUrl,
  bypassBatch,
  bypassWithTurnstileToken
};
