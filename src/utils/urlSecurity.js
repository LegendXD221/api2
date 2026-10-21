'use strict';
const net = require('node:net');
const dns = require('node:dns').promises;

function isBlockedIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a,b,c] = parts;
  return a === 0 || a === 10 || a === 127 || a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 0 || b === 168)) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113);
}
function isBlockedIPv6(ip) {
  const x = ip.toLowerCase().split('%')[0];
  if (x === '::' || x === '::1' || x.startsWith('fc') || x.startsWith('fd') || /^fe[89ab]/.test(x) || x.startsWith('ff')) return true;
  if (x.startsWith('::ffff:')) {
    const mapped = x.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isBlockedIPv4(mapped[1]) : true; // reject non-dotted mapped forms conservatively
  }
  if (x.startsWith('2001:db8:')) return true; // documentation range
  return false;
}
function isBlockedAddress(ip) {
  const family = net.isIP(ip);
  return family === 4 ? isBlockedIPv4(ip) : family === 6 ? isBlockedIPv6(ip) : true;
}
function validatePublicUrl(input) {
  let u;
  try { u = new URL(input); } catch { return { ok: false, code: 'INVALID_URL', message: 'Malformed URL' }; }
  if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, code: 'INVALID_URL', message: 'Only HTTP and HTTPS URLs are allowed' };
  if (u.username || u.password) return { ok: false, code: 'INVALID_URL', message: 'URLs containing credentials are not allowed' };
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return { ok: false, code: 'BLOCKED_DOMAIN', message: 'Local or internal domains are blocked' };
  if (net.isIP(host) && isBlockedAddress(host)) return { ok: false, code: 'BLOCKED_DOMAIN', message: 'Private or reserved IP addresses are blocked' };
  return { ok: true, url: u.href };
}
async function assertPublicUrl(input) {
  const result = validatePublicUrl(input);
  if (!result.ok) { const e = new Error(result.message); e.code = result.code; throw e; }
  const host = new URL(result.url).hostname.replace(/^\[|\]$/g, '');
  if (!net.isIP(host)) {
    let records;
    try { records = await dns.lookup(host, { all: true, verbatim: true }); }
    catch { const e = new Error('Hostname could not be resolved'); e.code = 'HOST_RESOLUTION_FAILED'; throw e; }
    if (!records.length || records.some(r => isBlockedAddress(r.address))) { const e = new Error('Hostname resolves to a private or reserved IP address'); e.code = 'BLOCKED_DOMAIN'; throw e; }
  }
  return result.url;
}
module.exports = { validatePublicUrl, assertPublicUrl, isBlockedAddress };
