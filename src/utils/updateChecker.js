/**
 * Periodic update checks
 */

const serviceUpdater = require('../config/updates/serviceUpdater');
const logger = require('./logger');

class UpdateChecker {
  constructor() {
    this.interval = null;
  }

  async check() {
    return serviceUpdater.check();
  }

  start(ms = 6 * 60 * 60 * 1000) {
    if (process.env.VERCEL) return;
    this.check();
    this.interval = setInterval(() => this.check().catch(e => logger.warn(e.message)), ms);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}

module.exports = new UpdateChecker();
