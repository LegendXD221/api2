/**
 * Axios wrapper — retries, stealth, redirects control
 */

const axios = require('axios');
const antiBot = require('./antiBot');
const logger = require('./logger');
const { config } = require('../config');

const DEFAULT_RETRIES = 3;
const BACKOFF = [1000, 2000, 4000];

async function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    data = null,
    timeout = config.requestTimeout,
    maxRedirects = 0,
    level = 'medium',
    sessionId = null,
    validateStatus = () => true
  } = options;

  const evasion = await antiBot.evade(level, sessionId);
  const finalHeaders = antiBot.transformHeaders(
    { ...evasion.headers, ...headers },
    level
  );

  let lastError = null;
  for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        const delay = BACKOFF[attempt - 1] + Math.floor(Math.random() * 300);
        await new Promise(r => setTimeout(r, delay));
      }
      const res = await axios({
        url,
        method,
        headers: finalHeaders,
        data,
        timeout,
        maxRedirects,
        validateStatus,
        responseType: 'text',
        decompress: true
      });
      return {
        status: res.status,
        headers: res.headers,
        data: res.data,
        url: res.request?.res?.responseUrl || url,
        attempt: attempt + 1
      };
    } catch (err) {
      lastError = err;
      logger.debug('Request attempt failed', {
        url,
        attempt: attempt + 1,
        error: err.message
      });
      if (err.code === 'ECONNABORTED' || err.response?.status >= 500) {
        continue;
      }
      // non-retryable
      break;
    }
  }
  throw lastError || new Error('Request failed');
}

async function get(url, opts = {}) {
  return request(url, { ...opts, method: 'GET' });
}

async function post(url, data, opts = {}) {
  return request(url, { ...opts, method: 'POST', data });
}

module.exports = {
  request,
  get,
  post
};
