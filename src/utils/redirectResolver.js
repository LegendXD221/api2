'use strict';
const axios = require('axios');
const stealth = require('./stealth');
const logger = require('./logger');
const { assertPublicUrl } = require('./urlSecurity');
const MAX_DEPTH = 15;
const TIMEOUT = 8000;
async function redirectResolver(startUrl, maxDepth = MAX_DEPTH) {
  let current = await assertPublicUrl(startUrl);
  const chain = [current];
  const seen = new Set(chain);
  for (let depth = 0; depth < maxDepth; depth++) {
    const res = await axios({ method: 'GET', url: current, maxRedirects: 0, validateStatus: s => s < 600, timeout: TIMEOUT, headers: stealth.buildStealthHeaders(current), responseType: 'text' });
    const status = res.status;
    const location = res.headers?.location;
    let next = null;
    if (status >= 300 && status < 400 && location) next = new URL(location, current).href;
    else if (typeof res.data === 'string') {
      const m = res.data.match(/<meta[^>]+http-equiv=["']?refresh["']?[^>]+content=["']?\d+;\s*url=([^"'\s>]+)/i);
      if (m?.[1]) next = new URL(m[1], current).href;
    }
    if (!next) return chain;
    next = await assertPublicUrl(next);
    if (seen.has(next)) { const e = new Error('Circular redirect detected'); e.code = 'REDIRECT_LOOP'; throw e; }
    seen.add(next); chain.push(next); current = next;
  }
  logger.warn('[RedirectResolver] Maximum redirect depth reached');
  const e = new Error('Maximum redirect depth reached'); e.code = 'REDIRECT_LIMIT'; throw e;
}
module.exports = { redirectResolver };
