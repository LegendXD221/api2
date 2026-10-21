/**
 * Enhanced stealth — UA rotation, header randomization, fingerprint pools
 */

const { config } = require('../config');

const DESKTOP_UAS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
];

const MOBILE_UAS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
];

const PLATFORMS = [
  { platform: 'Win32', secChUaPlatform: '"Windows"', mobile: false },
  { platform: 'MacIntel', secChUaPlatform: '"macOS"', mobile: false },
  { platform: 'Linux x86_64', secChUaPlatform: '"Linux"', mobile: false },
  { platform: 'iPhone', secChUaPlatform: '"iOS"', mobile: true },
  { platform: 'Linux armv8l', secChUaPlatform: '"Android"', mobile: true }
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFingerprint(level = 'medium') {
  const mobile = Math.random() < 0.25;
  const ua = mobile ? pick(MOBILE_UAS) : pick(DESKTOP_UAS);
  const plat = mobile
    ? PLATFORMS.find(p => p.mobile) || PLATFORMS[3]
    : pick(PLATFORMS.filter(p => !p.mobile));

  const screen = mobile
    ? { width: 390, height: 844, colorDepth: 24, pixelDepth: 24 }
    : { width: pick([1920, 2560, 1366, 1440]), height: pick([1080, 1440, 768, 900]), colorDepth: 24, pixelDepth: 24 };

  const fp = {
    userAgent: ua,
    platform: plat.platform,
    language: pick(['en-US', 'en-GB', 'en']),
    languages: ['en-US', 'en'],
    hardwareConcurrency: pick([4, 8, 12, 16]),
    deviceMemory: pick([4, 8, 16]),
    screen,
    timezoneOffset: pick([-480, -420, -360, -300, -240, 0, 60, 120]),
    webglVendor: pick(['Google Inc. (NVIDIA)', 'Google Inc. (Intel)', 'Google Inc. (AMD)']),
    webglRenderer: pick([
      'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)',
      'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
      'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0)'
    ]),
    canvasHash: Math.random().toString(36).slice(2, 14),
    audioHash: Math.random().toString(36).slice(2, 12),
    secChUa: '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
    secChUaMobile: mobile ? '?1' : '?0',
    secChUaPlatform: plat.secChUaPlatform
  };

  if (level === 'high' || level === 'maximum') {
    fp.doNotTrack = null;
    fp.pluginsLength = mobile ? 0 : randomInt(3, 5);
    fp.maxTouchPoints = mobile ? 5 : 0;
  }
  return fp;
}

function buildHeaders(fingerprint, extra = {}) {
  const h = {
    'User-Agent': fingerprint.userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': `${fingerprint.language},en;q=0.9`,
    'Accept-Encoding': 'gzip, deflate, br',
    'Sec-Ch-Ua': fingerprint.secChUa,
    'Sec-Ch-Ua-Mobile': fingerprint.secChUaMobile,
    'Sec-Ch-Ua-Platform': fingerprint.secChUaPlatform,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
    ...extra
  };

  if (config.stealth.headerOrderRandomization) {
    // Axios preserves insertion order for most cases; we just ensure critical ones first
  }
  return h;
}

function getStealthHeaders(level = 'medium', extra = {}) {
  const fp = generateFingerprint(level);
  return {
    headers: buildHeaders(fp, extra),
    fingerprint: fp
  };
}

function randomDelay(minMs = 80, maxMs = 320) {
  return new Promise(r => setTimeout(r, randomInt(minMs, maxMs)));
}

module.exports = {
  generateFingerprint,
  buildHeaders,
  getStealthHeaders,
  randomDelay,
  DESKTOP_UAS,
  MOBILE_UAS
};
