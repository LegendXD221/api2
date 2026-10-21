'use strict';

const axios = require('axios');
const config = require('../config');
const logger = require('./logger');
const cache = require('./cache');

const _stats = { solved: 0, failed: 0, byMethod: {} };
const _queue = new Map();

class CaptchaSolver {
  constructor() {
    this.methods = this._buildMethodChain();
  }

  _buildMethodChain() {
    const chain = [];
    if (config.turnstile.proxy1Url)   chain.push('internal_proxy');
    if (config.captcha.twoCaptchaKey) chain.push('2captcha');
    if (config.captcha.antiCaptchaKey) chain.push('anticaptcha');
    if (config.captcha.capsolverKey)  chain.push('capsolver');
    chain.push('manual_bypass');
    return chain;
  }

  // ── Public solve entry ─────────────────────────────────────────────────────
  async solveTurnstile({ sitekey, pageurl, url }) {
    const cacheKey = `${sitekey}:${pageurl || url}`;

    // Token cache check
    const cached = await cache.getTurnstile(cacheKey);
    if (cached) {
      logger.debug(`[CaptchaSolver] Cache hit for sitekey=${sitekey}`);
      return { success: true, token: cached, method: 'cache', cached: true };
    }

    // Queue deduplication — prevent race conditions on same sitekey
    if (_queue.has(cacheKey)) {
      return _queue.get(cacheKey);
    }

    const promise = this._solveWithFallback({ sitekey, pageurl: pageurl || url, cacheKey });
    _queue.set(cacheKey, promise);
    promise.finally(() => _queue.delete(cacheKey));
    return promise;
  }

  async _solveWithFallback({ sitekey, pageurl, cacheKey }) {
    for (const method of this.methods) {
      try {
        logger.debug(`[CaptchaSolver] Trying method=${method} sitekey=${sitekey}`);
        const result = await this._solve(method, { sitekey, pageurl });
        if (result?.token) {
          await cache.setTurnstile(cacheKey, result.token);
          _stats.solved++;
          _stats.byMethod[method] = (_stats.byMethod[method] || 0) + 1;
          return { success: true, token: result.token, method, cached: false };
        }
      } catch (err) {
        logger.warn(`[CaptchaSolver] Method ${method} failed: ${err.message}`);
      }
    }
    _stats.failed++;
    return { success: false, error: 'All solving methods exhausted' };
  }

  async _solve(method, { sitekey, pageurl }) {
    switch (method) {
      case 'internal_proxy': return this._solveInternalProxy(sitekey, pageurl);
      case '2captcha':       return this._solve2Captcha(sitekey, pageurl);
      case 'anticaptcha':    return this._solveAntiCaptcha(sitekey, pageurl);
      case 'capsolver':      return this._solveCapsolver(sitekey, pageurl);
      case 'manual_bypass':  return this._manualBypass(sitekey, pageurl);
      default: throw new Error(`Unknown method: ${method}`);
    }
  }

  // ── Internal proxy ─────────────────────────────────────────────────────────
  async _solveInternalProxy(sitekey, pageurl) {
    const { data } = await axios.post(config.turnstile.proxy1Url, {
      sitekey, pageurl, key: config.turnstile.proxy1Key
    }, { timeout: 30000 });
    if (data?.token) return { token: data.token };
    throw new Error('Internal proxy returned no token');
  }

  // ── 2Captcha ───────────────────────────────────────────────────────────────
  async _solve2Captcha(sitekey, pageurl) {
    const submitRes = await axios.post('https://2captcha.com/in.php', null, {
      params: {
        key: config.captcha.twoCaptchaKey,
        method: 'turnstile',
        sitekey, pageurl,
        json: 1
      },
      timeout: 15000
    });
    if (submitRes.data?.status !== 1) throw new Error('2Captcha submit failed');

    const taskId = submitRes.data.request;
    return this._poll2Captcha(taskId);
  }

  async _poll2Captcha(taskId) {
    for (let i = 0; i < 24; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await axios.get('https://2captcha.com/res.php', {
        params: { key: config.captcha.twoCaptchaKey, action: 'get', id: taskId, json: 1 },
        timeout: 10000
      });
      if (res.data?.status === 1) return { token: res.data.request };
      if (res.data?.request !== 'CAPCHA_NOT_READY') throw new Error(`2Captcha error: ${res.data.request}`);
    }
    throw new Error('2Captcha timeout');
  }

  // ── Anti-Captcha ──────────────────────────────────────────────────────────
  async _solveAntiCaptcha(sitekey, pageurl) {
    const createRes = await axios.post('https://api.anti-captcha.com/createTask', {
      clientKey: config.captcha.antiCaptchaKey,
      task: { type: 'TurnstileTaskProxyless', websiteURL: pageurl, websiteKey: sitekey }
    }, { timeout: 15000 });
    if (createRes.data?.errorId) throw new Error(`AntiCaptcha create: ${createRes.data.errorDescription}`);

    const taskId = createRes.data.taskId;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 5000));
      const res = await axios.post('https://api.anti-captcha.com/getTaskResult', {
        clientKey: config.captcha.antiCaptchaKey, taskId
      }, { timeout: 10000 });
      if (res.data?.status === 'ready') return { token: res.data.solution?.token };
      if (res.data?.errorId) throw new Error(`AntiCaptcha poll: ${res.data.errorDescription}`);
    }
    throw new Error('AntiCaptcha timeout');
  }

  // ── Capsolver ─────────────────────────────────────────────────────────────
  async _solveCapsolver(sitekey, pageurl) {
    const createRes = await axios.post('https://api.capsolver.com/createTask', {
      clientKey: config.captcha.capsolverKey,
      task: { type: 'AntiTurnstileTaskProxyLess', websiteURL: pageurl, websiteKey: sitekey }
    }, { timeout: 15000 });
    if (createRes.data?.errorId) throw new Error(`Capsolver create: ${createRes.data.errorDescription}`);

    const taskId = createRes.data.taskId;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 4000));
      const res = await axios.post('https://api.capsolver.com/getTaskResult', {
        clientKey: config.captcha.capsolverKey, taskId
      }, { timeout: 10000 });
      if (res.data?.status === 'ready') return { token: res.data.solution?.token };
      if (res.data?.errorId) throw new Error(`Capsolver poll: ${res.data.errorDescription}`);
    }
    throw new Error('Capsolver timeout');
  }

  // ── Manual bypass — try to extract token from page source ─────────────────
  async _manualBypass(sitekey, pageurl) {
    // Many Turnstile-gated pages expose a challenge_token or cf_clearance in cookies/source
    const { data: html } = await axios.get(pageurl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const match = html.match(/window\.__cf_chl_opt\s*=\s*\{[^}]*"cToken"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return { token: match[1] };
    throw new Error('Manual bypass: no token found in page source');
  }

  getStats() { return { ..._stats }; }
}

module.exports = new CaptchaSolver();
