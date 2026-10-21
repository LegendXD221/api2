/**
 * Applies local + remote update sources
 */

const latest = require('./latest');
const logger = require('../../utils/logger');

class ServiceUpdater {
  constructor() {
    this.lastCheck = null;
    this.applied = [];
  }

  async check() {
    this.lastCheck = new Date().toISOString();
    const result = {
      version: latest.version,
      lastUpdated: latest.lastUpdated,
      changes: latest.changes,
      newServices: latest.newServices,
      removedServices: latest.removedServices,
      checkedAt: this.lastCheck,
      source: 'local'
    };
    logger.info('Update check completed', { version: result.version });
    return result;
  }

  async apply() {
    // In full production this would merge remote diffs into SERVICES
    // For v3.0.0 we keep local latest.js as source of truth
    this.applied.push({ at: new Date().toISOString(), version: latest.version });
    return { applied: true, version: latest.version };
  }

  status() {
    return {
      lastCheck: this.lastCheck,
      applied: this.applied.slice(-5),
      current: latest.version
    };
  }
}

module.exports = new ServiceUpdater();
