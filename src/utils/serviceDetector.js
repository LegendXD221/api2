/**
 * Service detection — domain, alias auto-map, pattern, optional URL rewrite to canonical
 */

const { resolveAlias, autoDetectAlias } = require('../config/aliases');
const { getServiceByDomain, SERVICES } = require('../config/services');

function detect(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { detected: false, error: 'Invalid URL' };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const aliasInfo = autoDetectAlias(host);
  const canonical = aliasInfo.canonical || host;

  // Prefer domain match on original host, then canonical
  let service =
    getServiceByDomain(host) ||
    getServiceByDomain(canonical);

  // Pattern fallback
  if (!service) {
    for (const svc of Object.values(SERVICES)) {
      if (svc.patterns?.url && svc.patterns.url.test(rawUrl)) {
        service = svc;
        break;
      }
    }
  }

  if (!service) {
    return {
      detected: false,
      originalHost: host,
      canonicalHost: canonical,
      alias: aliasInfo,
      url: url.href,
      error: 'Unknown service'
    };
  }

  // Rewrite URL host to canonical when alias was used (keeps path/query)
  let resolvedUrl = url.href;
  if (aliasInfo.isAlias && canonical && host !== canonical) {
    try {
      const rewritten = new URL(url.href);
      rewritten.hostname = canonical;
      resolvedUrl = rewritten.href;
    } catch {
      resolvedUrl = url.href;
    }
  }

  return {
    detected: true,
    service: {
      name: service.name,
      key: service.key,
      type: service.type,
      isCanonical: !aliasInfo.isAlias && (service.domains || []).includes(host)
    },
    originalHost: host,
    canonicalHost: canonical,
    alias: aliasInfo,
    url: url.href,
    resolvedUrl
  };
}

module.exports = {
  detect
};
