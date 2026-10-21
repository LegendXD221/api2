'use strict';

const SERVICES = require('../config/services');
const { ALIASES } = require('../config/aliases');

class ServiceDetector {
  constructor() {
    this._domainMap = new Map();
    this._aliasMap = new Map();
    this._build();
  }

  _build() {
    for (const svc of SERVICES) {
      for (const domain of (svc.domains || [])) {
        this._domainMap.set(domain.toLowerCase(), svc);
      }
      for (const alias of (svc.aliases || [])) {
        this._aliasMap.set(alias.toLowerCase(), svc.key);
      }
    }
    // Add global aliases from aliases.js
    for (const [alias, key] of Object.entries(ALIASES)) {
      this._aliasMap.set(alias.toLowerCase(), key);
    }
  }

  detect(url) {
    let hostname;
    try {
      hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      return null;
    }

    // Direct domain match
    if (this._domainMap.has(hostname)) {
      const svc = this._domainMap.get(hostname);
      return { name: svc.name, key: svc.key, type: svc.type, isCanonical: true };
    }

    // Alias match → resolve to canonical
    if (this._aliasMap.has(hostname)) {
      const key = this._aliasMap.get(hostname);
      const svc = SERVICES.find(s => s.key === key);
      if (svc) return { name: svc.name, key: svc.key, type: svc.type, isCanonical: false, alias: hostname };
    }

    // Subdomain match — strip sub and retry
    const parts = hostname.split('.');
    if (parts.length > 2) {
      const root = parts.slice(-2).join('.');
      if (this._domainMap.has(root)) {
        const svc = this._domainMap.get(root);
        return { name: svc.name, key: svc.key, type: svc.type, isCanonical: false, subdomain: hostname };
      }
    }

    return null;
  }

  getService(key) {
    return SERVICES.find(s => s.key === key) || null;
  }
}

module.exports = new ServiceDetector();
