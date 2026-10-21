/**
 * Advanced CAPTCHA / Turnstile solver
 * Fallback: internal proxy → 2Captcha → Anti-Captcha → Capsolver → manual fail
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config');
const cache = require('./cache');
const antiBot = require('./antiBot');
const logger = require('./logger');

class CaptchaSolver {
  constructor() {
    this.queue = new Map(); // sitekey+pageurl → promise
    this.stats = {
      byType: {},
      byService: { internal: 0, '2captcha': 0, anticaptcha: 0, capsolver: 0, failed: 0 },
      total: 0,
      success: 0
    };
  }

  _cacheKey(type, sitekey, pageurl) {
    return `captcha:${type}:${sitekey}:${pageurl}`;
  }

  async solve({ type = 'turnstile', sitekey, pageurl, url, action, cdata } = {}) {
    if (!sitekey || !pageurl) {
      return { success: false, error: 'sitekey and pageurl required', code: 'INVALID_INPUT' };
    }

    const cacheKey = this._cacheKey(type, sitekey, pageurl);
    const cached = await cache.get(cacheKey);
    if (cached && cached.token) {
      logger.debug('CAPTCHA token cache hit', { sitekey });
      return { success: true, token: cached.token, solver: 'cache', method: cached.method };
    }

    // Queue dedupe
    const qKey = `${sitekey}|${pageurl}`;
    if (this.queue.has(qKey)) {
      return this.queue.get(qKey);
    }

    const job = this._solveInternal({ type, sitekey, pageurl, url, action, cdata });
    this.queue.set(qKey, job);
    try {
      const result = await job;
      if (result.success && result.token) {
        await cache.set(cacheKey, { token: result.token, method: result.method }, config.cache.turnstileTtl);
      }
      return result;
    } finally {
      this.queue.delete(qKey);
    }
  }

  async _solveInternal(opts) {
    this.stats.total += 1;
    this.stats.byType[opts.type] = (this.stats.byType[opts.type] || 0) + 1;

    // 1. Internal / proxy path (if configured)
    const internal = await this._tryInternalProxy(opts);
    if (internal.success) {
      this.stats.byService.internal += 1;
      this.stats.success += 1;
      return internal;
    }

    // 2. 2Captcha
    if (config.captcha.twoCaptcha) {
      const r = await this._try2Captcha(opts);
      if (r.success) {
        this.stats.byService['2captcha'] += 1;
        this.stats.success += 1;
        return r;
      }
    }

    // 3. Anti-Captcha
    if (config.captcha.antiCaptcha) {
      const r = await this._tryAntiCaptcha(opts);
      if (r.success) {
        this.stats.byService.anticaptcha += 1;
        this.stats.success += 1;
        return r;
      }
    }

    // 4. Capsolver
    if (config.captcha.capsolver) {
      const r = await this._tryCapsolver(opts);
      if (r.success) {
        this.stats.byService.capsolver += 1;
        this.stats.success += 1;
        return r;
      }
    }

    this.stats.byService.failed += 1;
    return {
      success: false,
      error: 'All CAPTCHA solvers failed or unconfigured',
      code: 'TURNSTILE_FAILED'
    };
  }

  async _tryInternalProxy(opts) {
    for (const proxy of config.turnstileProxies) {
      if (!proxy.url) continue;
      try {
        const evasion = await antiBot.evade('high');
        const res = await axios.post(
          proxy.url,
          {
            sitekey: opts.sitekey,
            pageurl: opts.pageurl,
            type: opts.type,
            key: proxy.key
          },
          {
            headers: evasion.headers,
            timeout: 25000
          }
        );
        if (res.data && (res.data.token || res.data.solution)) {
          return {
            success: true,
            token: res.data.token || res.data.solution,
            solver: 'internal',
            method: 'proxy'
          };
        }
      } catch (err) {
        logger.debug('Internal Turnstile proxy failed', { error: err.message });
      }
    }
    return { success: false };
  }

  async _try2Captcha(opts) {
    try {
      const key = config.captcha.twoCaptcha;
      const create = await axios.post('https://2captcha.com/in.php', null, {
        params: {
          key,
          method: opts.type === 'turnstile' ? 'turnstile' : 'userrecaptcha',
          sitekey: opts.sitekey,
          pageurl: opts.pageurl,
          json: 1
        },
        timeout: 15000
      });
      if (!create.data || create.data.status !== 1) {
        return { success: false, error: create.data?.request || '2captcha create failed' };
      }
      const taskId = create.data.request;
      // poll
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const poll = await axios.get('https://2captcha.com/res.php', {
          params: { key, action: 'get', id: taskId, json: 1 },
          timeout: 10000
        });
        if (poll.data.status === 1) {
          return { success: true, token: poll.data.request, solver: '2captcha', method: '2captcha' };
        }
        if (poll.data.request !== 'CAPCHA_NOT_READY') break;
      }
      return { success: false, error: '2captcha timeout' };
    } catch (err) {
      logger.debug('2Captcha error', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _tryAntiCaptcha(opts) {
    try {
      const key = config.captcha.antiCaptcha;
      const create = await axios.post('https://api.anti-captcha.com/createTask', {
        clientKey: key,
        task: {
          type: opts.type === 'turnstile' ? 'TurnstileTaskProxyless' : 'NoCaptchaTaskProxyless',
          websiteURL: opts.pageurl,
          websiteKey: opts.sitekey
        }
      }, { timeout: 15000 });
      if (create.data.errorId) {
        return { success: false, error: create.data.errorDescription };
      }
      const taskId = create.data.taskId;
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const poll = await axios.post('https://api.anti-captcha.com/getTaskResult', {
          clientKey: key,
          taskId
        }, { timeout: 10000 });
        if (poll.data.status === 'ready') {
          const token = poll.data.solution?.token || poll.data.solution?.gRecaptchaResponse;
          return { success: true, token, solver: 'anticaptcha', method: 'anticaptcha' };
        }
        if (poll.data.errorId) break;
      }
      return { success: false, error: 'anticaptcha timeout' };
    } catch (err) {
      logger.debug('AntiCaptcha error', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  async _tryCapsolver(opts) {
    try {
      const key = config.captcha.capsolver;
      const create = await axios.post('https://api.capsolver.com/createTask', {
        clientKey: key,
        task: {
          type: opts.type === 'turnstile' ? 'AntiTurnstileTaskProxyLess' : 'ReCaptchaV2TaskProxyLess',
          websiteURL: opts.pageurl,
          websiteKey: opts.sitekey
        }
      }, { timeout: 15000 });
      if (create.data.errorId) {
        return { success: false, error: create.data.errorDescription };
      }
      const taskId = create.data.taskId;
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 4000));
        const poll = await axios.post('https://api.capsolver.com/getTaskResult', {
          clientKey: key,
          taskId
        }, { timeout: 10000 });
        if (poll.data.status === 'ready') {
          const token = poll.data.solution?.token || poll.data.solution?.gRecaptchaResponse;
          return { success: true, token, solver: 'capsolver', method: 'capsolver' };
        }
        if (poll.data.errorId) break;
      }
      return { success: false, error: 'capsolver timeout' };
    } catch (err) {
      logger.debug('Capsolver error', { error: err.message });
      return { success: false, error: err.message };
    }
  }

  getStats() {
    return { ...this.stats };
  }
}

module.exports = new CaptchaSolver();
