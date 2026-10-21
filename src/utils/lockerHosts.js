/**
 * All known locker / shortener hosts — built from SERVICES + extras
 * Used to decide if a URL is still an intermediate hop
 */

const { SERVICES } = require('../config/services');

const EXTRA_LOCKER_HOSTS = [
  'linkvertise.com', 'linkvertise.net', 'link-center.net', 'lnk.to',
  'work.ink', 'workink.net', 'workink.link',
  'lootlabs.gg', 'loot-link.com', 'lootlinks.com', 'lootdest.com',
  'lockr.me', 'lockr.so',
  'boost.ink', 'booo.st', 'bst.gg', 'mboost.me',
  'ouo.io', 'ouo.press',
  'bstlar.com', 'bstshrt.com',
  'rekonise.com', 'socialwolvez.com',
  'sub2unlock.com', 'sub2unlock.net', 'sub4unlock.com', 'sub2boost.com',
  'ytsub.me', 'social-unlock.com', 'sub2get.com',
  'cuty.io', 'cety.io', 'cutty.ly',
  'adfoc.us', 'adf.ly',
  'exe.io', 'exey.io',
  'rentry.org', 'rentry.co',
  'pastebin.com', 'justpaste.it', 'paste.red',
  'keyrblx.com', 'nexhub.gg', 'luau.pro',
  'linkvertise.lol', 'rip.linkvertise.lol'
];

function buildLockerSet() {
  const set = new Set(EXTRA_LOCKER_HOSTS.map(h => h.toLowerCase()));
  for (const svc of Object.values(SERVICES)) {
    for (const d of svc.domains || []) set.add(d.toLowerCase().replace(/^www\./, ''));
    for (const a of svc.aliases || []) set.add(a.toLowerCase().replace(/^www\./, ''));
  }
  return set;
}

let LOCKER = buildLockerSet();

function refreshLockerHosts() {
  LOCKER = buildLockerSet();
  return LOCKER;
}

function isLockerHost(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase().replace(/^www\./, '');
  if (LOCKER.has(h)) return true;
  // suffix match e.g. sub.linkvertise.com
  for (const known of LOCKER) {
    if (h.endsWith('.' + known)) return true;
  }
  return false;
}

function isSameOrLocker(urlA, urlB) {
  try {
    const a = new URL(urlA);
    const b = new URL(urlB);
    if (a.href.split('#')[0] === b.href.split('#')[0]) return true;
    if (isLockerHost(a.hostname) && isLockerHost(b.hostname) && a.pathname === b.pathname) return true;
  } catch {}
  return false;
}

function isFinalDestination(url) {
  try {
    const u = new URL(url);
    return !isLockerHost(u.hostname);
  } catch {
    return false;
  }
}

module.exports = {
  isLockerHost,
  isFinalDestination,
  isSameOrLocker,
  refreshLockerHosts,
  getLockerHosts: () => LOCKER
};
