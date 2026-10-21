'use strict';

const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const config = require('../config');
const logger = require('./logger');
const stealth = require('./stealth');
const { assertPublicUrl } = require('./urlSecurity');

// Patch axios with cookie support
wrapper(axios);

class RequestManager {
  constructor() {
    this._jars = new Map();
  }

  _getJar(domain) {
    if (!this._jars.has(domain)) this._jars.set(domain, new CookieJar());
    return this._jars.get(domain);
  }

  _getDomain(url) {
    try { return new URL(url).hostname; } catch { return url; }
  }

  async get(url, opts = {}) {
    return this._request({ method: 'GET', url, ...opts });
  }

  async post(url, data, opts = {}) {
    return this._request({ method: 'POST', url, data, ...opts });
  }

  async _request({ method, url, data, headers = {}, timeout, retries, followRedirects = false, sessionId }) {
    url = await assertPublicUrl(url);
    const domain = this._getDomain(url);
    const jar = this._getJar(sessionId || domain);
    const ua = stealth.pickUA(false);
    const stealthHeaders = stealth.buildStealthHeaders(url);
    const mergedHeaders = { ...stealthHeaders, ...headers };
    const maxRetries = retries ?? config.request.retries;
    const timeoutMs = timeout ?? config.request.timeout;

    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        const delay = config.request.retryDelays[attempt - 1] ?? 4000;
        const jitter = Math.floor(Math.random() * 500);
        await new Promise(r => setTimeout(r, delay + jitter));
        logger.debug(`[Request] Retry ${attempt}/${maxRetries} for ${url}`);
      }

      try {
        const response = await axios({
          method,
          url,
          data,
          headers: mergedHeaders,
          timeout: timeoutMs,
          // Redirects are disabled by default to prevent redirect-based SSRF.
          maxRedirects: followRedirects ? 0 : 0,
          jar,
          withCredentials: true,
          validateStatus: s => s < 500,
          decompress: true
        });

        return response;
      } catch (err) {
        lastErr = err;
        if (err.response?.status === 429) {
          logger.warn(`[Request] Rate limited on ${url}, waiting 5s`);
          await new Promise(r => setTimeout(r, 5000));
        }
      }
    }

    throw lastErr;
  }
}

module.exports = new RequestManager();
