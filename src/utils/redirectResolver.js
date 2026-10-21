/**
 * Multi-hop redirect resolution
 * - HTTP Location
 * - meta refresh
 * - JS location assignments
 * - JSON destination fields
 * circular detection + depth cap
 */

const { get } = require('./request');
const logger = require('./logger');

function extractNextFromBody(html, baseUrl) {
  if (!html || typeof html !== 'string') return null;

  const patterns = [
    /http-equiv=["']?refresh["']?\s+content=["']?\d+\s*;\s*url=([^"'>\s]+)/i,
    /(?:window\.location|location\.href|location\.replace|document\.location)\s*=\s*["']([^"']+)["']/i,
    /(?:window\.location|location)\.(?:assign|replace)\s*\(\s*["']([^"']+)["']\s*\)/i,
    /"destination"\s*:\s*"([^"]+)"/i,
    /"target"\s*:\s*"([^"]+)"/i,
    /"redirect(?:_?url)?"\s*:\s*"([^"]+)"/i,
    /"url"\s*:\s*"(https?:[^"]+)"/i,
    /"link"\s*:\s*"(https?:[^"]+)"/i,
    /href=["'](https?:[^"']+)["'][^>]*(?:id|class)=["'][^"']*(?:continue|getlink|download|target|btn-primary)/i
  ];

  for (const p of patterns) {
    const m = html.match(p);
    if (!m || !m[1]) continue;
    let next = m[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/').replace(/&amp;/g, '&');
    try {
      return new URL(next, baseUrl).href;
    } catch {
      if (/^https?:\/\//i.test(next)) return next;
    }
  }
  return null;
}

async function resolve(url, { maxHops = 8, level = 'medium', sessionId = null } = {}) {
  const chain = [];
  const seen = new Set();
  let current = url;
  let hops = 0;
  let lastStatus = null;

  while (hops < maxHops) {
    const key = current.split('#')[0];
    if (seen.has(key)) {
      return {
        success: false,
        error: 'Circular redirect detected',
        code: 'CIRCULAR',
        chain,
        finalUrl: current,
        hops
      };
    }
    seen.add(key);
    chain.push(current);

    try {
      const res = await get(current, {
        maxRedirects: 0,
        level,
        sessionId,
        timeout: 12000
      });
      lastStatus = res.status;

      const location = res.headers.location || res.headers.Location;
      if (res.status >= 300 && res.status < 400 && location) {
        try {
          current = new URL(location, current).href;
        } catch {
          current = location;
        }
        hops += 1;
        continue;
      }

      const fromBody = extractNextFromBody(
        typeof res.data === 'string' ? res.data : '',
        current
      );
      if (fromBody && fromBody.split('#')[0] !== key) {
        current = fromBody;
        hops += 1;
        continue;
      }

      // Terminal page
      return {
        success: true,
        finalUrl: current,
        chain,
        hops,
        status: lastStatus
      };
    } catch (err) {
      logger.debug('Redirect hop failed', { current, error: err.message });
      // If we already moved at least once, return last good URL as partial success
      if (chain.length > 1) {
        return {
          success: true,
          finalUrl: chain[chain.length - 2],
          chain,
          hops,
          status: lastStatus,
          warning: err.message
        };
      }
      return {
        success: false,
        error: err.message,
        code: 'NETWORK_ERROR',
        chain,
        finalUrl: current,
        hops
      };
    }
  }

  return {
    success: chain.length > 1,
    error: chain.length > 1 ? undefined : 'Max hops exceeded',
    code: chain.length > 1 ? undefined : 'MAX_HOPS',
    chain,
    finalUrl: current,
    hops
  };
}

module.exports = {
  resolve,
  extractNextFromBody
};
