/**
 * Smart caching — memory + optional Redis
 */

const { config } = require('../config');
const logger = require('./logger');

let store = new Map();
let redis = null;
let ready = false;

async function init() {
  if (config.redis.url) {
    try {
      const Redis = require('ioredis');
      redis = new Redis(config.redis.url, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
        lazyConnect: true
      });
      await redis.connect();
      ready = true;
      logger.info('Redis cache connected');
    } catch (err) {
      logger.warn('Redis unavailable, falling back to memory', { error: err.message });
      redis = null;
    }
  }
  ready = true;
}

function memKey(key) {
  return `bp:${key}`;
}

async function get(key) {
  const k = memKey(key);
  if (redis) {
    try {
      const raw = await redis.get(k);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      logger.debug('Redis get failed', { key, error: e.message });
    }
  }
  const entry = store.get(k);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(k);
    return null;
  }
  return entry.value;
}

async function set(key, value, ttlSeconds) {
  const k = memKey(key);
  const ttl = ttlSeconds || config.cache.successTtl;
  if (redis) {
    try {
      await redis.set(k, JSON.stringify(value), 'EX', ttl);
    } catch (e) {
      logger.debug('Redis set failed', { key, error: e.message });
    }
  }
  store.set(k, { value, expires: Date.now() + ttl * 1000 });
  // prune memory if large
  if (store.size > 5000) {
    const now = Date.now();
    for (const [mk, mv] of store) {
      if (now > mv.expires) store.delete(mk);
    }
  }
}

async function del(key) {
  const k = memKey(key);
  store.delete(k);
  if (redis) {
    try { await redis.del(k); } catch {}
  }
}

async function clear() {
  store.clear();
  if (redis) {
    try {
      const keys = await redis.keys('bp:*');
      if (keys.length) await redis.del(...keys);
    } catch {}
  }
  return { cleared: true };
}

function stats() {
  return {
    memoryEntries: store.size,
    redis: !!redis
  };
}

module.exports = {
  init,
  get,
  set,
  del,
  clear,
  stats
};
