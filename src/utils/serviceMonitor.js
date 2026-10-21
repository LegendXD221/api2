/**
 * Lightweight service monitor — health sampling every 6h when running long-lived
 */

const logger = require('./logger');
const { listServices } = require('../config/services');

class ServiceMonitor {
  constructor() {
    this.lastRun = null;
    this.results = {};
    this.interval = null;
  }

  async runOnce() {
    this.lastRun = new Date().toISOString();
    const services = listServices();
    // On serverless we only record structure; live probes optional
    this.results = {
      checked: services.length,
      at: this.lastRun,
      note: 'Structure health only in this build; live probes require long-lived process'
    };
    logger.info('Service monitor tick', this.results);
    return this.results;
  }

  start(ms = 6 * 60 * 60 * 1000) {
    if (process.env.VERCEL) return; // skip on Vercel
    this.runOnce();
    this.interval = setInterval(() => this.runOnce(), ms);
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }

  status() {
    return { lastRun: this.lastRun, results: this.results };
  }
}

module.exports = new ServiceMonitor();
