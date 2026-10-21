/**
 * Comprehensive anti-bot system — detection patterns + 12 evasion techniques
 * Levels: low | medium | high | maximum
 */

const { getStealthHeaders, randomDelay, generateFingerprint } = require('./stealth');
const logger = require('./logger');

const BOT_UA_PATTERNS = [
  /bot|crawl|spider|slurp|scrapy|httpclient|python-requests|curl|wget|axios|node-fetch|go-http|java\//i,
  /headless|phantom|selenium|puppeteer|playwright|webdriver/i
];

const SUSPICIOUS_HEADERS = [
  'x-forwarded-for',
  'x-real-ip',
  'via',
  'forwarded'
];

class AntiBot {
  constructor() {
    this.profiles = new Map(); // sessionId → fingerprint
    this.stats = {
      detections: 0,
      evasions: 0,
      byLevel: { low: 0, medium: 0, high: 0, maximum: 0 }
    };
  }

  /**
   * Detect if incoming request looks like a bot (for middleware)
   */
  detectIncoming(req) {
    const ua = (req.headers['user-agent'] || '').toLowerCase();
    const reasons = [];

    for (const p of BOT_UA_PATTERNS) {
      if (p.test(ua)) {
        reasons.push('blocked_ua');
        break;
      }
    }
    if (!ua || ua.length < 20) reasons.push('missing_or_short_ua');
    if (!req.headers['accept-language']) reasons.push('no_accept_language');
    if (req.headers['x-requested-with'] === 'XMLHttpRequest' && !req.headers['referer']) {
      reasons.push('xhr_no_referer');
    }

    const isBot = reasons.length > 0;
    if (isBot) this.stats.detections += 1;
    return { isBot, reasons };
  }

  /**
   * Build evasion package for outbound requests
   */
  async evade(level = 'medium', sessionId = null) {
    const lvl = ['low', 'medium', 'high', 'maximum'].includes(level) ? level : 'medium';
    this.stats.byLevel[lvl] += 1;
    this.stats.evasions += 1;

    let fp;
    if (sessionId && this.profiles.has(sessionId)) {
      fp = this.profiles.get(sessionId);
    } else {
      fp = generateFingerprint(lvl);
      if (sessionId) this.profiles.set(sessionId, fp);
    }

    const { headers } = getStealthHeaders(lvl);

    // Technique list applied by level
    const techniques = {
      low: ['header_spoof', 'ua_rotation'],
      medium: ['header_spoof', 'ua_rotation', 'navigator_spoof', 'client_hints', 'behavioral_delay'],
      high: [
        'header_spoof', 'ua_rotation', 'navigator_spoof', 'client_hints',
        'behavioral_delay', 'screen_spoof', 'webgl_spoof', 'canvas_spoof',
        'request_transform'
      ],
      maximum: [
        'header_spoof', 'ua_rotation', 'navigator_spoof', 'client_hints',
        'behavioral_delay', 'screen_spoof', 'webgl_spoof', 'canvas_spoof',
        'audiocontext_spoof', 'webrtc_spoof', 'mouse_sim', 'typing_sim',
        'request_transform', 'session_mgmt'
      ]
    };

    if (lvl === 'medium' || lvl === 'high' || lvl === 'maximum') {
      await randomDelay(60, 220);
    }
    if (lvl === 'high' || lvl === 'maximum') {
      await randomDelay(40, 120);
    }

    return {
      headers,
      fingerprint: fp,
      techniques: techniques[lvl],
      level: lvl
    };
  }

  /**
   * Transform headers further (request header transformation)
   */
  transformHeaders(headers, level = 'medium') {
    const out = { ...headers };
    // Drop or randomize some automation-telltale headers if present
    delete out['x-puppeteer'];
    delete out['x-selenium'];
    if (level === 'high' || level === 'maximum') {
      // Ensure Accept order looks browser-like
      if (!out['Accept']) {
        out['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
      }
    }
    return out;
  }

  getStats() {
    return { ...this.stats, cachedProfiles: this.profiles.size };
  }

  clearProfiles() {
    this.profiles.clear();
  }
}

module.exports = new AntiBot();
