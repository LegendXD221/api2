'use strict';

const NodeCache = require('node-cache');
const config = require('../config');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this._mem = new NodeCache({ stdTTL: config.cache.successTtl, checkperiod: 120 });
    this._stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  _key(prefix, value) {
    return `${prefix}:${value}`;
  }

  async get(type, url) {
    const key = this._key(type, url);
    const val = this._mem.get(key);
    if (val !== undefined) { this._stats.hits++; return val; }
    this._stats.misses++;
    return null;
  }

  async set(type, url, data, ttlOverride) {
    const key = this._key(type, url);
    const ttl = ttlOverride ?? (data && data.success !== false
      ? config.cache.successTtl
      : config.cache.failureTtl);
    this._mem.set(key, data, ttl);
    this._stats.sets++;
  }

  async getBypass(url)          { return this.get('bypass', url); }
  async setBypass(url, data)    { return this.set('bypass', url, data); }
  async setBypassFail(url, data){ return this.set('bypass', url, data, config.cache.failureTtl); }

  async getTurnstile(sitekey)        { return this.get('ts', sitekey); }
  async setTurnstile(sitekey, token) { return this.set('ts', sitekey, token, config.cache.turnstileTtl); }

  async clear() {
    this._mem.flushAll();
    logger.info('[Cache] Flushed all entries');
  }

  async getStats() {
    return { ...this._stats, keys: this._mem.keys().length };
  }
}

module.exports = new CacheManager();
