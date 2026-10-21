/**
 * Full alias map — static + auto from SERVICES
 */

const { SERVICES } = require('./services');

const STATIC_ALIASES = {
  // Linkvertise family
  'link-center.net': 'linkvertise.com',
  'linkvertise.net': 'linkvertise.com',
  'lnk.to': 'linkvertise.com',
  'linkvertise.com': 'linkvertise.com',
  'linkvertise.org': 'linkvertise.com',
  'lv.me': 'linkvertise.com',
  'direct-link.net': 'linkvertise.com',

  // Work.ink family
  'work.ink': 'work.ink',
  'workink.net': 'work.ink',
  'workink.link': 'work.ink',

  // Loot / Admaven
  'lootlabs.gg': 'lootlabs.gg',
  'loot-link.com': 'lootlabs.gg',
  'lootlinks.com': 'lootlabs.gg',
  'lootdest.com': 'lootlabs.gg',
  'lootdest.info': 'lootlabs.gg',

  // Lockr
  'lockr.me': 'lockr.me',
  'lockr.so': 'lockr.me',

  // Boost family
  'boost.ink': 'boost.ink',
  'booo.st': 'boost.ink',
  'bst.gg': 'mboost.me',
  'mboost.me': 'mboost.me',

  // Ouo
  'ouo.io': 'ouo.io',
  'ouo.press': 'ouo.io',

  // Cuty
  'cuty.io': 'cutty.ly',
  'cety.io': 'cutty.ly',
  'cutty.ly': 'cutty.ly',
  'cutty.link': 'cutty.ly',

  // Adf / Adfoc
  'adf.ly': 'adfoc.us',
  'adfoc.us': 'adfoc.us',
  'ay.live': 'adfoc.us',

  // Exe
  'exe.io': 'exe.io',
  'exey.io': 'exe.io',
  'exee.io': 'exe.io',

  // Rentry
  'rentry.org': 'rentry.org',
  'rentry.co': 'rentry.org',

  // Sub unlock family
  'sub2unlock.com': 'sub2unlock.com',
  'sub2unlock.net': 'sub2unlock.com',
  'sub4unlock.com': 'sub4unlock.com',
  'sub2boost.com': 'sub2boost.com',
  'sub2get.com': 'sub2get.com',
  'social-unlock.com': 'social-unlock.com',
  'ytsub.me': 'ytsub.me',

  // Pastes
  'pastebin.com': 'pastebin.com',
  'justpaste.it': 'justpaste.it',
  'paste.red': 'paste.red',
  'pastedrop.com': 'pastedrop.com',
  'paste-drop.com': 'pastedrop.com',

  // Key systems
  'keyrblx.com': 'keyrblx.com',
  'nexhub.gg': 'nexhub.gg',
  'nexhubser-api.vercel.app': 'nexhub.gg',
  'luau.pro': 'luau.pro',
  'rblxscripthub.com': 'rblxscripthub.com',
  'violated.lol': 'violated.lol'
};

function buildAliasMap() {
  const map = { ...STATIC_ALIASES };
  for (const svc of Object.values(SERVICES)) {
    const domains = svc.domains || [];
    if (!domains.length) continue;
    const canonical = domains[0].toLowerCase().replace(/^www\./, '');
    for (const d of domains) {
      map[d.toLowerCase().replace(/^www\./, '')] = canonical;
    }
    for (const a of svc.aliases || []) {
      map[a.toLowerCase().replace(/^www\./, '')] = canonical;
    }
  }
  return map;
}

let ALIASES = buildAliasMap();

function refreshAliases() {
  ALIASES = buildAliasMap();
  return ALIASES;
}

function resolveAlias(hostname) {
  if (!hostname) return null;
  const host = hostname.toLowerCase().replace(/^www\./, '');
  return ALIASES[host] || host;
}

function getAliasesFor(canonical) {
  const c = (canonical || '').toLowerCase().replace(/^www\./, '');
  return Object.entries(ALIASES)
    .filter(([, v]) => v === c)
    .map(([k]) => k);
}

function autoDetectAlias(hostname) {
  if (!hostname) return { host: null, canonical: null, isAlias: false, known: false };
  const host = hostname.toLowerCase().replace(/^www\./, '');
  const canonical = resolveAlias(host);
  const known = Object.prototype.hasOwnProperty.call(ALIASES, host) || Object.values(ALIASES).includes(host);
  return {
    host,
    canonical,
    isAlias: known && host !== canonical,
    known
  };
}

module.exports = {
  get ALIASES() {
    return ALIASES;
  },
  resolveAlias,
  getAliasesFor,
  autoDetectAlias,
  refreshAliases,
  buildAliasMap
};
