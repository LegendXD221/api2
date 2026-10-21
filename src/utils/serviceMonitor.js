'use strict';

const axios = require('axios');
const SERVICES = require('../config/services');
const logger = require('./logger');
const stealth = require('./stealth');

const INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
const _health = new Map();
let _timer = null;

async function checkService(svc) {
  const url = `https://${svc.domains[0]}`;
  try {
    const res = await axios.head(url, {
      timeout: 8000,
      headers: stealth.buildStealthHeaders(url),
      maxRedirects: 5,
      validateStatus: s => s < 600
    });
    const up = res.status < 500;
    _health.set(svc.key, { up, status: res.status, lastCheck: Date.now() });
  } catch {
    _health.set(svc.key, { up: false, status: 0, lastCheck: Date.now() });
  }
}

async function runAll() {
  logger.info('[ServiceMonitor] Starting health check for all services');
  const batch = [];
  for (const svc of SERVICES) {
    batch.push(checkService(svc));
    if (batch.length >= 5) {
      await Promise.allSettled(batch.splice(0, 5));
      await new Promise(r => setTimeout(r, 500));
    }
  }
  await Promise.allSettled(batch);
  logger.info('[ServiceMonitor] Health check complete');
}

function isHealthy(key) {
  const h = _health.get(key);
  return !h || h.up; // default to healthy if no data yet
}

function start() {
  runAll();
  _timer = setInterval(runAll, INTERVAL);
}

function stop() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

module.exports = { start, stop, isHealthy, getHealth: () => Object.fromEntries(_health) };
