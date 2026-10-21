/**
 * Turnstile detection + solving via captchaSolver
 */

const { get } = require('../utils/request');
const captchaSolver = require('../utils/captchaSolver');
const logger = require('../utils/logger');

const SITEKEY_RE = /data-sitekey=["']([^"']+)["']/i;
const TURNSTILE_SCRIPT = /challenges\.cloudflare\.com\/turnstile|cf-turnstile/i;

async function checkForTurnstile(url, { level = 'medium' } = {}) {
  try {
    const res = await get(url, { level, maxRedirects: 2, timeout: 12000 });
    const html = typeof res.data === 'string' ? res.data : '';
    const has = TURNSTILE_SCRIPT.test(html) || SITEKEY_RE.test(html);
    let sitekey = null;
    const m = html.match(SITEKEY_RE);
    if (m) sitekey = m[1];
    return {
      present: has,
      sitekey,
      pageurl: url,
      status: res.status
    };
  } catch (err) {
    logger.debug('Turnstile check failed', { url, error: err.message });
    return { present: false, error: err.message };
  }
}

async function solveTurnstile({ url, sitekey, pageurl, level = 'high' } = {}) {
  const page = pageurl || url;
  if (!sitekey) {
    const check = await checkForTurnstile(page, { level });
    if (!check.sitekey) {
      return {
        success: false,
        error: 'No sitekey found',
        code: 'TURNSTILE_FAILED'
      };
    }
    sitekey = check.sitekey;
  }

  const result = await captchaSolver.solve({
    type: 'turnstile',
    sitekey,
    pageurl: page,
    url: page
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Solve failed',
      code: 'TURNSTILE_FAILED'
    };
  }

  return {
    success: true,
    token: result.token,
    sitekey,
    pageurl: page,
    solver: result.solver,
    method: result.method
  };
}

module.exports = {
  checkForTurnstile,
  solveTurnstile
};
