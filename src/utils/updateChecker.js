'use strict';
const config = require('../config');
const logger = require('./logger');
const latest = require('../config/updates/latest');
const { applyUpdates } = require('../config/updates/serviceUpdater');
let _status = { lastCheck: null, version: '3.0.0', latestBundledVersion: latest.version, upToDate: null, source: 'bundled-metadata-only' };
let _timer = null;
function getStatus() { return { ..._status }; }
async function forceCheck() {
  try {
    applyUpdates();
    _status = { ..._status, lastCheck: new Date().toISOString(), latestBundledVersion: latest.version, upToDate: null, source: 'bundled-metadata-only' };
    return { success: true, ..._status, note: 'No remote update server is configured; only bundled metadata was checked.' };
  } catch (err) {
    logger.error('[UpdateChecker] Local patch application failed', { error: err.message });
    _status = { ..._status, lastCheck: new Date().toISOString(), upToDate: null, errorCode: 'LOCAL_UPDATE_FAILED' };
    return { success: false, ..._status, error: 'Local update check failed' };
  }
}
function start() {
  if (!config.updates.enabled || _timer) return;
  void forceCheck();
  _timer = setInterval(() => { void forceCheck(); }, config.updates.checkInterval);
  if (_timer.unref) _timer.unref();
  logger.info(`[UpdateChecker] Started — interval ${config.updates.checkInterval / 3600000}h`);
}
function stop() { if (_timer) { clearInterval(_timer); _timer = null; } }
module.exports = { getStatus, forceCheck, start, stop };
