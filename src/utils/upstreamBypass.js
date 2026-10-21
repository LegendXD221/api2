/**
 * Optional upstream bypass providers (env-configured)
 * BYPASS_UPSTREAM_URLS=https://example.com/api?url={url},...
 * Each template must contain {url} placeholder
 */

const axios = require('axios');
const logger = require('./logger');
const { isFinalDestination } = require('./lockerHosts');

function getTemplates() {
  const raw = process.env.BYPASS_UPSTREAM_URLS || '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(s => s.includes('{url}'));
}

function pickDestination(data) {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      if (/^https?:\/\//i.test(data.trim())) return data.trim();
      return null;
    }
  }
  const candidates = [
    data.direct,
    data.result,
    data.destination,
    data.url,
    data.target,
    data.link,
    data.data?.target,
    data.data?.url,
    data.data?.destination
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c) && isFinalDestination(c)) {
      return c;
    }
  }
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c)) return c;
  }
  return null;
}

async function tryUpstream(url) {
  const templates = getTemplates();
  if (!templates.length) return { success: false, error: 'no upstream configured' };

  for (const tpl of templates) {
    const endpoint = tpl.replace('{url}', encodeURIComponent(url));
    try {
      const res = await axios.get(endpoint, {
        timeout: 20000,
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent': 'bypass-api/3.0.0'
        },
        validateStatus: () => true
      });
      const dest = pickDestination(res.data);
      if (dest && dest !== url) {
        return {
          success: true,
          destination: dest,
          method: 'upstream',
          provider: new URL(endpoint).hostname
        };
      }
    } catch (err) {
      logger.debug('Upstream failed', { endpoint, error: err.message });
    }
  }
  return { success: false, error: 'all upstreams failed' };
}

module.exports = {
  tryUpstream,
  getTemplates
};
