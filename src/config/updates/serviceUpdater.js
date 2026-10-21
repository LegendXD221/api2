'use strict';

const SERVICES = require('../services');
const latest = require('./latest');
const logger = require('../../utils/logger');

function applyUpdates() {
  if (!latest.changes || !latest.changes.length) return;
  for (const change of latest.changes) {
    const svc = SERVICES.find(s => s.key === change.key);
    if (svc && change.patch) {
      Object.assign(svc, change.patch);
      logger.info(`[ServiceUpdater] Applied patch to ${svc.name}: ${change.change}`);
    }
  }
}

module.exports = { applyUpdates };
