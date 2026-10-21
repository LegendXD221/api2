'use strict';

// ── User Agent pool ──────────────────────────────────────────────────────────
const UA_POOL_DESKTOP = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/106.0.0.0'
];

const UA_POOL_MOBILE = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.43 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.163 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
];

// ── Header profiles keyed by platform ────────────────────────────────────────
const HEADER_PROFILES = {
  chrome_windows: {
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  },
  chrome_mac: {
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  },
  firefox_windows: {
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1'
  }
};

// ── Fingerprint generator ─────────────────────────────────────────────────────
function generateFingerprint(ua) {
  const isChrome = ua.includes('Chrome') && !ua.includes('Edg');
  const isFirefox = ua.includes('Firefox');
  const isMac = ua.includes('Macintosh');
  const isWin = ua.includes('Windows');
  const isMobile = ua.includes('Mobile');

  const screens = [
    { w: 1920, h: 1080 }, { w: 2560, h: 1440 }, { w: 1366, h: 768 },
    { w: 1440, h: 900 }, { w: 1280, h: 720 }, { w: 2560, h: 1080 }
  ];
  const screen = screens[Math.floor(Math.random() * screens.length)];

  const timezones = ['America/New_York', 'America/Los_Angeles', 'America/Chicago',
    'Europe/London', 'Europe/Berlin', 'Asia/Tokyo'];
  const tz = timezones[Math.floor(Math.random() * timezones.length)];

  let profile = 'chrome_windows';
  if (isChrome && isMac) profile = 'chrome_mac';
  if (isFirefox && isWin) profile = 'firefox_windows';

  return {
    navigator: {
      userAgent: ua,
      platform: isMac ? 'MacIntel' : (isMobile ? 'Linux armv8l' : 'Win32'),
      language: 'en-US',
      languages: ['en-US', 'en'],
      hardwareConcurrency: [2, 4, 6, 8, 12, 16][Math.floor(Math.random() * 6)],
      deviceMemory: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
      cookieEnabled: true,
      doNotTrack: null,
      vendor: isChrome ? 'Google Inc.' : (isFirefox ? '' : 'Apple Computer, Inc.'),
      maxTouchPoints: isMobile ? Math.floor(Math.random() * 5) + 1 : 0
    },
    screen: {
      width: screen.w,
      height: screen.h,
      colorDepth: 24,
      pixelDepth: 24,
      availWidth: screen.w,
      availHeight: screen.h - 40
    },
    webgl: {
      vendor: 'Google Inc. (NVIDIA)',
      renderer: `ANGLE (NVIDIA, NVIDIA GeForce GTX ${[970, 1060, 1080, 3060, 4070][Math.floor(Math.random() * 5)]} Direct3D11 vs_5_0 ps_5_0, D3D11)`,
      version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)'
    },
    canvas: generateCanvasNoise(),
    audioContext: { sampleRate: 44100, channelCount: 2 },
    timezone: tz,
    headerProfile: profile
  };
}

function generateCanvasNoise() {
  // Unique 8-hex canvas fingerprint noise
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xFFFFFFFF).toString(16).padStart(8, '0')
  ).join('');
}

function pickUA(mobile = false) {
  const pool = mobile ? UA_POOL_MOBILE : UA_POOL_DESKTOP;
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildHeaders(ua, referer, extraHeaders = {}) {
  const fp = generateFingerprint(ua);
  const profile = HEADER_PROFILES[fp.headerProfile] || HEADER_PROFILES.chrome_windows;

  const base = {
    'User-Agent': ua,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'max-age=0',
    ...profile
  };

  if (referer) base['Referer'] = referer;
  return { ...base, ...extraHeaders };
}

function buildStealthHeaders(url, level = 'medium') {
  const ua = pickUA(false);
  const origin = (() => { try { const u = new URL(url); return u.origin; } catch { return null; } })();
  return buildHeaders(ua, origin);
}

// Shared fingerprint cache: reuse within a session window to look consistent
const _fpCache = new Map();
function getSessionFingerprint(sessionId) {
  if (_fpCache.has(sessionId)) return _fpCache.get(sessionId);
  const ua = pickUA(false);
  const fp = generateFingerprint(ua);
  _fpCache.set(sessionId, { ua, fp });
  setTimeout(() => _fpCache.delete(sessionId), 10 * 60 * 1000);
  return { ua, fp };
}

module.exports = {
  pickUA,
  buildHeaders,
  buildStealthHeaders,
  generateFingerprint,
  getSessionFingerprint,
  UA_POOL_DESKTOP,
  UA_POOL_MOBILE
};
