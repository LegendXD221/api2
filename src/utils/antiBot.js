'use strict';

const stealth = require('./stealth');

// ── Detection pattern banks ───────────────────────────────────────────────────
const BOT_HEADER_PATTERNS = [
  /^curl\//i, /^python-requests/i, /^go-http-client/i, /^java\//i,
  /^wget\//i, /^axios\//i, /^node-fetch/i, /^got\//i, /^superagent/i,
  /^undici/i, /^okhttp/i, /^httpie/i
];

const SUSPICIOUS_HEADERS = ['x-forwarded-for', 'via', 'x-real-ip'];

const BOT_IP_RANGES = [
  /^66\.249\./, /^66\.102\./, /^64\.233\./, /^72\.14\./,   // Google
  /^157\.55\./, /^40\.77\./, /^13\.66\./,                   // Bing
  /^34\./, /^35\./                                           // GCP broad
];

// ── Evasion technique implementations ────────────────────────────────────────
const EVASION_LEVELS = {
  low:     ['header_spoof', 'navigator_spoof'],
  medium:  ['header_spoof', 'navigator_spoof', 'screen_spoof', 'webgl_fingerprint', 'canvas_fingerprint'],
  high:    ['header_spoof', 'navigator_spoof', 'screen_spoof', 'webgl_fingerprint', 'canvas_fingerprint',
            'audio_fingerprint', 'webrtc_spoof', 'behavioral_delay'],
  maximum: ['header_spoof', 'navigator_spoof', 'screen_spoof', 'webgl_fingerprint', 'canvas_fingerprint',
            'audio_fingerprint', 'webrtc_spoof', 'behavioral_delay', 'mouse_simulation',
            'typing_simulation', 'request_transform', 'session_management']
};

// ── Global stats tracking ─────────────────────────────────────────────────────
const _stats = {
  requests: 0,
  botBlocked: 0,
  evasionApplied: 0,
  byLevel: { low: 0, medium: 0, high: 0, maximum: 0 }
};

// ── Core functions ────────────────────────────────────────────────────────────

function detectBot(req) {
  const ua = req.headers['user-agent'] || '';
  const ip = req.ip || req.connection?.remoteAddress || '';

  for (const pat of BOT_HEADER_PATTERNS) {
    if (pat.test(ua)) return { isBot: true, reason: 'ua_pattern', pattern: pat.toString() };
  }

  if (!ua || ua.length < 20) {
    return { isBot: true, reason: 'empty_ua' };
  }

  for (const range of BOT_IP_RANGES) {
    if (range.test(ip)) return { isBot: true, reason: 'bot_ip', ip };
  }

  return { isBot: false };
}

function applyEvasion(headers, level = 'medium', url = '') {
  const techniques = EVASION_LEVELS[level] || EVASION_LEVELS.medium;
  const ua = stealth.pickUA(false);
  const { fp } = stealth.getSessionFingerprint(url + level);

  const result = { ...headers };

  if (techniques.includes('header_spoof')) {
    result['User-Agent'] = ua;
    result['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
    result['Accept-Language'] = 'en-US,en;q=0.9';
    result['Accept-Encoding'] = 'gzip, deflate, br';
  }

  if (techniques.includes('navigator_spoof')) {
    // These inject into the headers the values that match fingerprint data
    result['sec-ch-ua'] = '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
    result['sec-ch-ua-mobile'] = '?0';
    result['sec-ch-ua-platform'] = `"${fp.navigator.platform.includes('Mac') ? 'macOS' : 'Windows'}"`;
  }

  if (techniques.includes('request_transform')) {
    // Normalize header casing to browser-standard
    const normalized = {};
    const ORDER = [
      'host', 'connection', 'cache-control', 'upgrade-insecure-requests',
      'user-agent', 'accept', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform',
      'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-user', 'sec-fetch-dest',
      'referer', 'accept-encoding', 'accept-language', 'cookie'
    ];
    for (const key of ORDER) {
      const found = Object.keys(result).find(k => k.toLowerCase() === key);
      if (found) normalized[key] = result[found];
    }
    for (const [k, v] of Object.entries(result)) {
      if (!normalized[k.toLowerCase()]) normalized[k.toLowerCase()] = v;
    }
    return normalized;
  }

  _stats.evasionApplied++;
  if (_stats.byLevel[level] !== undefined) _stats.byLevel[level]++;

  return result;
}

async function behavioralDelay(level = 'medium') {
  const delays = { low: [0, 100], medium: [100, 500], high: [500, 1500], maximum: [800, 2500] };
  const [min, max] = delays[level] || delays.medium;
  const ms = Math.floor(Math.random() * (max - min)) + min;
  await new Promise(r => setTimeout(r, ms));
}

function buildEvasionHeaders(url, level = 'medium') {
  const base = stealth.buildStealthHeaders(url, level);
  return applyEvasion(base, level, url);
}

function getStats() {
  return { ..._stats };
}

module.exports = {
  detectBot,
  applyEvasion,
  behavioralDelay,
  buildEvasionHeaders,
  getStats,
  EVASION_LEVELS
};
