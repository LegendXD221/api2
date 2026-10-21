'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const captchaSolver = require('../utils/captchaSolver');
const stealth = require('../utils/stealth');
const { buildEvasionHeaders } = require('../utils/antiBot');
const logger = require('../utils/logger');
const { assertPublicUrl } = require('../utils/urlSecurity');

// ── Detection ────────────────────────────────────────────────────────────────
async function check(url) {
  url = await assertPublicUrl(url);
  const headers = buildEvasionHeaders(url, 'medium');
  try {
    const res = await axios.get(url, { headers, timeout: 10000, maxRedirects: 5 });
    const html = typeof res.data === 'string' ? res.data : '';
    const hasTurnstile = detectTurnstile(html);
    const sitekey = hasTurnstile ? extractSitekey(html) : null;
    return { hasTurnstile, sitekey, url };
  } catch (err) {
    logger.warn(`[TurnstileHandler] Check failed for ${url}: ${err.message}`);
    return { hasTurnstile: false, sitekey: null, url };
  }
}

function detectTurnstile(html) {
  return (
    html.includes('challenges.cloudflare.com/turnstile') ||
    html.includes('cf-turnstile') ||
    /turnstile\.sitekey/i.test(html) ||
    /data-sitekey/i.test(html)
  );
}

function extractSitekey(html) {
  const patterns = [
    /data-sitekey=["']([^"']+)["']/i,
    /sitekey:\s*["']([^"']+)["']/i,
    /turnstile\.sitekey\s*=\s*["']([^"']+)["']/i,
    /"sitekey"\s*:\s*"([^"]+)"/
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) return m[1];
  }
  return null;
}

// ── Solve ─────────────────────────────────────────────────────────────────────
async function solve({ url, sitekey, pageurl }) {
  url = await assertPublicUrl(url);
  const target = await assertPublicUrl(pageurl || url);
  logger.info(`[TurnstileHandler] Solving sitekey=${sitekey} url=${target}`);
  const result = await captchaSolver.solveTurnstile({ sitekey, pageurl: target, url });
  if (result.success) {
    logger.info(`[TurnstileHandler] Solved via ${result.method}`);
  } else {
    logger.warn(`[TurnstileHandler] Failed to solve Turnstile for ${target}`);
  }
  return result;
}

module.exports = { check, solve, detectTurnstile, extractSitekey };
