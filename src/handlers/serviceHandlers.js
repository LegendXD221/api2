/**
 * Per-service + generic bypass — all 88 services route through working strategies
 */

const { get, post } = require('../utils/request');
const { resolve, extractNextFromBody } = require('../utils/redirectResolver');
const { getServiceByKey, SERVICES } = require('../config/services');
const {
  isFinalDestination,
  isSameOrLocker
} = require('../utils/lockerHosts');
const logger = require('../utils/logger');

function extractDestination(html, baseUrl) {
  if (!html || typeof html !== 'string') return null;
  // shared patterns + extra
  const extra = [
    /data-url=["'](https?:[^"']+)["']/i,
    /data-href=["'](https?:[^"']+)["']/i,
    /data-target=["'](https?:[^"']+)["']/i,
    /data-link=["'](https?:[^"']+)["']/i,
    /href=["'](https?:[^"']+)["'][^>]*class=["'][^"']*(?:get-link|btn-get|continue|download|unlock)/i,
    /(?:finalUrl|destinationUrl|targetUrl|redirectUrl)\s*[:=]\s*["'](https?:[^"']+)["']/i,
    /atob\s*\(\s*["']([A-Za-z0-9+/=]+)["']\s*\)/i
  ];
  for (const p of extra) {
    const m = html.match(p);
    if (!m) continue;
    let val = m[1];
    if (p.source.includes('atob')) {
      try {
        val = Buffer.from(val, 'base64').toString('utf8');
      } catch {
        continue;
      }
    }
    if (/^https?:\/\//i.test(val)) {
      try {
        return new URL(val, baseUrl).href;
      } catch {
        return val;
      }
    }
  }
  return extractNextFromBody(html, baseUrl);
}

async function deepen(destination, opts, depth = 0) {
  if (!destination || depth > 6) return destination;
  if (isFinalDestination(destination)) return destination;
  try {
    const next = await resolve(destination, {
      maxHops: 5,
      level: opts.level || 'medium'
    });
    if (next.success && next.finalUrl && !isSameOrLocker(next.finalUrl, destination)) {
      if (isFinalDestination(next.finalUrl)) return next.finalUrl;
      return deepen(next.finalUrl, opts, depth + 1);
    }
  } catch {}
  return destination;
}

function ok(destination, method, status, extra = {}) {
  if (!destination || !/^https?:\/\//i.test(String(destination))) {
    return { success: false, error: 'Invalid destination', code: 'SERVICE_UNAVAILABLE' };
  }
  return {
    success: true,
    destination: String(destination),
    method,
    status: status || 200,
    isFinal: isFinalDestination(destination),
    ...extra
  };
}

function fail(error, code = 'SERVICE_UNAVAILABLE', status) {
  return { success: false, error, code, status };
}

function parseJson(data) {
  if (data == null) return null;
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function pickUrl(...cands) {
  for (const c of cands) {
    if (typeof c === 'string' && /^https?:\/\//i.test(c)) return c;
  }
  return null;
}

/* ========== GENERIC ========== */

async function bypassDirect(url, service, opts = {}) {
  const level = opts.level || 'medium';
  let res;
  try {
    res = await get(url, {
      level,
      maxRedirects: 0,
      timeout: service?.bypass?.timeout || 12000,
      headers: service?.bypass?.headers || {}
    });
  } catch (err) {
    const resolved = await resolve(url, {
      maxHops: service?.multiHop?.maxHops || 8,
      level
    });
    if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, url)) {
      return ok(await deepen(resolved.finalUrl, opts), 'multi_hop_fallback', resolved.status, {
        chain: resolved.chain
      });
    }
    return fail(err.message, 'NETWORK_ERROR');
  }

  const loc = res.headers.location || res.headers.Location;
  if (res.status >= 300 && res.status < 400 && loc) {
    try {
      let dest = new URL(loc, url).href;
      dest = await deepen(dest, opts);
      if (!isSameOrLocker(dest, url)) return ok(dest, 'redirect', res.status);
    } catch {}
  }

  const body = typeof res.data === 'string' ? res.data : '';
  const extracted = extractDestination(body, url);
  if (extracted && !isSameOrLocker(extracted, url)) {
    return ok(await deepen(extracted, opts), 'extract', res.status);
  }

  // JSON body
  const j = parseJson(body);
  if (j) {
    const u = pickUrl(
      j.destination,
      j.target,
      j.url,
      j.link,
      j.redirect,
      j.data?.target,
      j.data?.url,
      j.data?.destination,
      j.result
    );
    if (u && !isSameOrLocker(u, url)) {
      return ok(await deepen(u, opts), 'json', res.status);
    }
  }

  const resolved = await resolve(url, {
    maxHops: service?.multiHop?.maxHops || 8,
    level
  });
  if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, url)) {
    return ok(await deepen(resolved.finalUrl, opts), 'multi_hop', resolved.status, {
      chain: resolved.chain
    });
  }

  return fail('Could not extract final destination', 'SERVICE_UNAVAILABLE', res.status);
}

/* ========== LINKVERTISE ========== */

function lvPathFromUrl(raw) {
  try {
    let u = raw
      .replace(/%3D/gi, '=')
      .replace(/[?&]o=sharing/gi, '')
      .replace(/dynamic\?r=/i, 'dynamic/?r=');
    const url = new URL(u);
    let m = url.pathname.match(/\/(\d+)\/([^/?#]+)/);
    if (m) return `/${m[1]}/${m[2]}`;
    m = url.pathname.match(/\/(\d+)(?:\/|$)/);
    if (m) return `/${m[1]}`;
    if (/dynamic/i.test(url.pathname) || url.searchParams.has('r')) {
      const p = url.pathname.replace(/\/$/, '');
      if (p && p !== '/') return p + (url.search || '');
    }
    const p = url.pathname.replace(/\/$/, '');
    return p && p !== '/' ? p : null;
  } catch {
    return null;
  }
}

async function bypassLinkvertise(url, service, opts = {}) {
  const level = opts.level || 'high';
  const path = lvPathFromUrl(url);
  if (!path) return bypassDirect(url, service, opts);

  const hosts = [
    'https://publisher.linkvertise.com',
    'https://linkvertise.net',
    'https://linkvertise.com'
  ];
  const headers = {
    Accept: 'application/json, text/plain, */*',
    Origin: 'https://linkvertise.com',
    Referer: 'https://linkvertise.com/',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
  };

  for (const host of hosts) {
    try {
      for (const suffix of [
        '/captcha',
        '/countdown_impression?trafficOrigin=network',
        '/todo_impression?mobile=true&trafficOrigin=network'
      ]) {
        try {
          await get(`${host}/api/v1/redirect/link${path}${suffix}`, {
            level,
            maxRedirects: 0,
            timeout: 8000,
            headers
          });
        } catch {}
      }

      let staticRes;
      try {
        staticRes = await get(`${host}/api/v1/redirect/link/static${path}`, {
          level,
          maxRedirects: 0,
          timeout: 12000,
          headers
        });
      } catch {
        continue;
      }

      const j = parseJson(staticRes.data);
      const link = j?.data?.link || j?.link;
      if (!link?.id) {
        const dest = extractDestination(
          typeof staticRes.data === 'string' ? staticRes.data : '',
          url
        );
        if (dest && !isSameOrLocker(dest, url)) {
          return ok(await deepen(dest, opts), 'linkvertise_static_extract', staticRes.status);
        }
        continue;
      }

      const targetType =
        link.target_type === 'PASTE' || link.targetType === 'PASTE' ? 'paste' : 'target';

      let userToken = null;
      try {
        const acc = await get(`${host}/api/v1/account`, {
          level,
          maxRedirects: 0,
          timeout: 8000,
          headers
        });
        const aj = parseJson(acc.data);
        userToken = aj?.user_token || aj?.data?.user_token || null;
      } catch {}

      const serial = Buffer.from(
        JSON.stringify({
          timestamp: Date.now(),
          random: '6548307',
          link_id: link.id
        })
      ).toString('base64');

      const ut = userToken ? `X-Linkvertise-UT=${encodeURIComponent(userToken)}` : '';

      const postTargets = [
        `${host}/api/v1/redirect/link${path}/${targetType}${ut ? '?' + ut : ''}`,
        `${host}/api/v1/redirect/link${path}/target${ut ? '?' + ut : ''}`,
        `${host}/api/v1/redirect/link${path}/paste${ut ? '?' + ut : ''}`
      ];

      for (const pu of postTargets) {
        try {
          const res = await post(pu, JSON.stringify({ serial }), {
            level,
            maxRedirects: 0,
            timeout: 12000,
            headers: { ...headers, 'Content-Type': 'application/json' }
          });
          const rj = parseJson(res.data);
          const target = pickUrl(
            rj?.data?.target,
            rj?.data?.paste,
            rj?.target,
            rj?.paste,
            rj?.data?.url
          );
          if (target && !isSameOrLocker(target, url)) {
            return ok(await deepen(target, opts), 'linkvertise_post', res.status);
          }
        } catch {}
      }

      const getTargets = [
        `${host}/api/v1/redirect/link${path}/${targetType}?serial=${encodeURIComponent(serial)}${ut ? '&' + ut : ''}`,
        `${host}/api/v1/redirect/link${path}/target?serial=${encodeURIComponent(serial)}${ut ? '&' + ut : ''}`
      ];
      for (const gu of getTargets) {
        try {
          const res = await get(gu, { level, maxRedirects: 0, timeout: 12000, headers });
          const rj = parseJson(res.data);
          const target = pickUrl(rj?.data?.target, rj?.data?.paste, rj?.target, rj?.paste);
          if (target && !isSameOrLocker(target, url)) {
            return ok(await deepen(target, opts), 'linkvertise_get', res.status);
          }
        } catch {}
      }
    } catch (e) {
      logger.debug('LV host fail', { host, error: e.message });
    }
  }

  // mirror
  try {
    const swapped = url
      .replace('://linkvertise.com', '://linkvertise.lol')
      .replace('://link-center.net', '://linkvertise.lol')
      .replace('://lnk.to', '://linkvertise.lol');
    if (swapped !== url) {
      const resolved = await resolve(swapped, { maxHops: 8, level });
      if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, url)) {
        return ok(await deepen(resolved.finalUrl, opts), 'linkvertise_mirror', resolved.status, {
          chain: resolved.chain
        });
      }
    }
  } catch {}

  return bypassDirect(url, service, opts);
}

/* ========== OUO ========== */

async function bypassOuo(url, service, opts = {}) {
  const level = opts.level || 'high';
  const first = await bypassDirect(url, service, { ...opts, level });
  if (first.success && first.isFinal) return first;

  try {
    const res = await get(url, { level, maxRedirects: 0, timeout: 12000 });
    const body = typeof res.data === 'string' ? res.data : '';
    const token =
      (body.match(/name=["']_token["']\s+value=["']([^"']+)["']/i) || [])[1] ||
      (body.match(/value=["']([^"']+)["']\s+name=["']_token["']/i) || [])[1];
    if (token) {
      const res2 = await post(
        url,
        new URLSearchParams({ _token: token }).toString(),
        {
          level,
          maxRedirects: 0,
          timeout: 12000,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Referer: url
          }
        }
      );
      const loc = res2.headers.location || res2.headers.Location;
      if (loc) {
        const dest = await deepen(new URL(loc, url).href, opts);
        if (!isSameOrLocker(dest, url)) return ok(dest, 'ouo_form', res2.status);
      }
      const extracted = extractDestination(
        typeof res2.data === 'string' ? res2.data : '',
        url
      );
      if (extracted && !isSameOrLocker(extracted, url)) {
        return ok(await deepen(extracted, opts), 'ouo_extract', res2.status);
      }
    }
  } catch (e) {
    logger.debug('ouo fail', { error: e.message });
  }
  return first.success ? first : fail('ouo bypass failed');
}

/* ========== BOOST / MBOOST ========== */

async function bypassBoost(url, service, opts = {}) {
  const level = opts.level || 'high';
  const direct = await bypassDirect(url, service, { ...opts, level });
  if (direct.success && direct.isFinal) return direct;

  try {
    const res = await get(url, {
      level,
      maxRedirects: 0,
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
    });
    const body = typeof res.data === 'string' ? res.data : '';
    const j = parseJson(body);
    if (j) {
      const target = pickUrl(j.url, j.destination, j.target, j.data?.url, j.link);
      if (target && !isSameOrLocker(target, url)) {
        return ok(await deepen(target, opts), 'boost_api', res.status);
      }
    }
    const kekw = body.match(/kekw["'\s:=]+([A-Za-z0-9+/=]{8,})/i);
    if (kekw) {
      try {
        const decoded = Buffer.from(kekw[1], 'base64').toString('utf8');
        if (/^https?:/i.test(decoded) && !isSameOrLocker(decoded, url)) {
          return ok(await deepen(decoded, opts), 'boost_kekw', res.status);
        }
      } catch {}
    }
  } catch {}
  return direct;
}

/* ========== ADFOC / ADF.LY ========== */

async function bypassAdf(url, service, opts = {}) {
  const level = opts.level || 'medium';
  try {
    const res = await get(url, { level, maxRedirects: 0, timeout: 12000 });
    const body = typeof res.data === 'string' ? res.data : '';
    // ysmm XOR decode (classic adf.ly)
    const ysmm = body.match(/var\s+ysmm\s*=\s*['"]([^'"]+)['"]/);
    if (ysmm) {
      const decoded = decodeYsmm(ysmm[1]);
      if (decoded && !isSameOrLocker(decoded, url)) {
        return ok(await deepen(decoded, opts), 'adf_ysmm', res.status);
      }
    }
  } catch {}
  return bypassDirect(url, service, opts);
}

function decodeYsmm(ysmm) {
  try {
    let a = '',
      b = '';
    for (let i = 0; i < ysmm.length; i++) {
      if (i % 2 === 0) a += ysmm[i];
      else b = ysmm[i] + b;
    }
    const mixed = (a + b).split('');
    for (let i = 0; i < mixed.length; i++) {
      if (!isNaN(mixed[i])) {
        for (let j = i + 1; j < mixed.length; j++) {
          if (!isNaN(mixed[j])) {
            const s = parseInt(mixed[i], 10) ^ parseInt(mixed[j], 10);
            if (s < 10) mixed[i] = String(s);
            i = j;
            break;
          }
        }
      }
    }
    const decoded = Buffer.from(mixed.join(''), 'base64').toString('utf8');
    const m = decoded.match(/(https?:\/\/[^]+)/);
    return m ? m[1].replace(/\s.*/, '') : null;
  } catch {
    return null;
  }
}

/* ========== WORK.INK / LOOT / LOCKR style JSON ========== */

async function bypassJsonLocker(url, service, opts = {}) {
  const level = opts.level || 'high';
  const headersList = [
    { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    { Accept: 'text/html,application/xhtml+xml' }
  ];

  for (const headers of headersList) {
    try {
      const res = await get(url, { level, maxRedirects: 0, timeout: 12000, headers });
      const body = typeof res.data === 'string' ? res.data : '';
      const j = parseJson(body);
      if (j) {
        const target = pickUrl(
          j.destination,
          j.target,
          j.url,
          j.link,
          j.redirect,
          j.data?.url,
          j.data?.target,
          j.data?.destination,
          j.result,
          j.direct
        );
        if (target && !isSameOrLocker(target, url)) {
          return ok(await deepen(target, opts), 'json_locker', res.status);
        }
      }
      const extracted = extractDestination(body, url);
      if (extracted && !isSameOrLocker(extracted, url)) {
        return ok(await deepen(extracted, opts), 'html_locker', res.status);
      }
      const loc = res.headers.location || res.headers.Location;
      if (loc) {
        const dest = await deepen(new URL(loc, url).href, opts);
        if (!isSameOrLocker(dest, url)) return ok(dest, 'redirect', res.status);
      }
    } catch {}
  }
  return bypassDirect(url, service, opts);
}

/* ========== PASTE SITES ========== */

async function bypassPaste(url, service, opts = {}) {
  const level = opts.level || 'medium';
  try {
    const res = await get(url, { level, maxRedirects: 0, timeout: 10000 });
    const body = typeof res.data === 'string' ? res.data : '';
    // raw paste content often is the destination or contains it
    const lines = body
      .replace(/<[^>]+>/g, '\n')
      .split(/\n/)
      .map(l => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      if (/^https?:\/\//i.test(line) && !isSameOrLocker(line, url)) {
        return ok(await deepen(line, opts), 'paste_line', res.status);
      }
    }
    const extracted = extractDestination(body, url);
    if (extracted && !isSameOrLocker(extracted, url)) {
      return ok(await deepen(extracted, opts), 'paste_extract', res.status);
    }
  } catch {}
  return bypassDirect(url, service, opts);
}

/* ========== REKONISE / SOCIAL UNLOCK ========== */

async function bypassRekonise(url, service, opts = {}) {
  const level = opts.level || 'high';
  try {
    // rekonise often exposes /api/v1/socials or similar on same host
    const u = new URL(url);
    const candidates = [
      url,
      `${u.origin}/api/v1/socials/${u.pathname.split('/').filter(Boolean).pop()}`,
      `${u.origin}/api/v1/links/${u.pathname.split('/').filter(Boolean).pop()}`
    ];
    for (const c of candidates) {
      try {
        const res = await get(c, {
          level,
          maxRedirects: 0,
          timeout: 12000,
          headers: { Accept: 'application/json' }
        });
        const j = parseJson(res.data);
        if (j) {
          const target = pickUrl(
            j.url,
            j.destination,
            j.target,
            j.data?.url,
            j.data?.destination,
            j.link
          );
          if (target && !isSameOrLocker(target, url)) {
            return ok(await deepen(target, opts), 'rekonise_api', res.status);
          }
        }
        const extracted = extractDestination(
          typeof res.data === 'string' ? res.data : '',
          url
        );
        if (extracted && !isSameOrLocker(extracted, url)) {
          return ok(await deepen(extracted, opts), 'rekonise_extract', res.status);
        }
      } catch {}
    }
  } catch {}
  return bypassDirect(url, service, opts);
}

/* ========== SUB2UNLOCK / YTSUB ========== */

async function bypassSubUnlock(url, service, opts = {}) {
  return bypassJsonLocker(url, service, opts);
}

/* ========== KEY SYSTEMS (generic API + page extract) ========== */

async function bypassKeySystem(url, service, opts = {}) {
  const level = opts.level || 'high';
  // try common key endpoints
  try {
    const u = new URL(url);
    const slug = u.pathname.split('/').filter(Boolean).pop();
    const candidates = [
      url,
      `${u.origin}/api/key/${slug}`,
      `${u.origin}/api/v1/key/${slug}`,
      `${u.origin}/api/getkey?url=${encodeURIComponent(url)}`,
      `${u.origin}/get-key`
    ];
    for (const c of candidates) {
      try {
        const res = await get(c, {
          level,
          maxRedirects: 0,
          timeout: 12000,
          headers: { Accept: 'application/json, text/html' }
        });
        const j = parseJson(res.data);
        if (j) {
          const target = pickUrl(
            j.key,
            j.url,
            j.link,
            j.destination,
            j.data?.key,
            j.data?.url,
            j.result
          );
          // key systems sometimes return a key string not URL — still useful
          if (target && /^https?:/i.test(target) && !isSameOrLocker(target, url)) {
            return ok(await deepen(target, opts), 'key_api', res.status);
          }
          if (typeof j.key === 'string' && j.key.length > 8 && !/^https?:/i.test(j.key)) {
            // return key as destination-like payload via data URL is wrong —
            // expose via method note; treat as success with destination = original + key in extra
            return {
              success: true,
              destination: url,
              key: j.key,
              method: 'key_value',
              status: res.status,
              isFinal: false,
              warning: 'Returned key value, not a URL destination'
            };
          }
        }
        const extracted = extractDestination(
          typeof res.data === 'string' ? res.data : '',
          url
        );
        if (extracted && !isSameOrLocker(extracted, url)) {
          return ok(await deepen(extracted, opts), 'key_extract', res.status);
        }
      } catch {}
    }
  } catch {}
  return bypassDirect(url, service, opts);
}

/* ========== ROUTER ========== */

const HANDLER_MAP = {
  linkvertise: bypassLinkvertise,
  ouo: bypassOuo,
  boostink: bypassBoost,
  boostylink: bypassBoost,
  mboost: bypassBoost,
  adfocus: bypassAdf,
  lootlabs: bypassJsonLocker,
  lockr: bypassJsonLocker,
  rekonise: bypassRekonise,
  socialwolvez: bypassRekonise,
  sub: bypassSubUnlock,
  sub2boost: bypassSubUnlock,
  sub4unlock: bypassSubUnlock,
  ytsubme: bypassSubUnlock,
  pastebin: bypassPaste,
  justpaste: bypassPaste,
  pastered: bypassPaste,
  pasteanon: bypassPaste,
  pastecry: bypassPaste,
  pastedrop: bypassPaste,
  pastelua: bypassPaste,
  rentry: bypassPaste,
  scriptpastebin: bypassPaste,
  ghostpaste: bypassPaste,
  // key systems
  keyrblx: bypassKeySystem,
  nexhub: bypassKeySystem,
  nexhubser: bypassKeySystem,
  absent: bypassKeySystem,
  axon: bypassKeySystem,
  bloxhub: bypassKeySystem,
  cmhub: bypassKeySystem,
  centuscript: bypassKeySystem,
  cloverhub: bypassKeySystem,
  codex: bypassKeySystem,
  cokeboys: bypassLinkvertise,
  deltaandroid: bypassKeySystem,
  earnlinks: bypassJsonLocker,
  flowauth: bypassKeySystem,
  getgold: bypassKeySystem,
  h4xscripts: bypassKeySystem,
  hohohub: bypassKeySystem,
  limbohub: bypassKeySystem,
  luaarmor: bypassKeySystem,
  madium: bypassKeySystem,
  molyn: bypassKeySystem,
  mykeysystem: bypassKeySystem,
  nrlscript: bypassKeySystem,
  neoxsoftworks: bypassKeySystem,
  orcakey: bypassKeySystem,
  pandaantibypass: bypassKeySystem,
  pandadevelopment: bypassKeySystem,
  platorelay: bypassKeySystem,
  relzhub: bypassKeySystem,
  rifton: bypassKeySystem,
  sift: bypassKeySystem,
  syshub: bypassKeySystem,
  teddyhub: bypassKeySystem,
  trigon: bypassKeySystem,
  violated: bypassKeySystem,
  weretools: bypassKeySystem,
  zeroinhubkey: bypassKeySystem,
  zeroinhub: bypassJsonLocker,
  luaupro: bypassKeySystem,
  rblxscripthub: bypassKeySystem,
  bstlar: bypassJsonLocker,
  bstshrt: bypassJsonLocker,
  bicolink: bypassJsonLocker,
  cutty: bypassJsonLocker,
  fileshot: bypassJsonLocker,
  gaterlnk: bypassJsonLocker,
  haxscripts: bypassJsonLocker,
  lnbz: bypassJsonLocker,
  linkunlock: bypassJsonLocker,
  link4sub: bypassSubUnlock,
  link4m: bypassJsonLocker,
  linkgate: bypassJsonLocker,
  linkunlocker: bypassJsonLocker,
  linkify: bypassJsonLocker,
  linkzy: bypassJsonLocker,
  retrievemods: bypassJsonLocker,
  rinku: bypassJsonLocker,
  sfl: bypassJsonLocker,
  shortener: bypassJsonLocker,
  shortxlinks: bypassJsonLocker,
  unlocknow: bypassJsonLocker,
  exeio: bypassJsonLocker,
  subnise: bypassSubUnlock,
  tpi: bypassJsonLocker,
};

async function bypassByService(url, serviceKey, opts = {}) {
  const service = getServiceByKey(serviceKey);
  if (!service) return fail('Unknown service key', 'INVALID_URL');

  const handler = HANDLER_MAP[serviceKey] || bypassDirect;
  try {
    const result = await handler(url, service, opts);
    // key_value exception: destination may equal input
    if (result.method === 'key_value' && result.key) return result;
    if (result.success && result.destination && isSameOrLocker(result.destination, url)) {
      return fail('Resolved to same or locker URL', 'SERVICE_UNAVAILABLE');
    }
    return result;
  } catch (err) {
    logger.debug('handler error', { serviceKey, error: err.message });
    return fail(err.message, 'NETWORK_ERROR');
  }
}

module.exports = {
  bypassByService,
  bypassDirect,
  extractDestination,
  deepen,
  lvPathFromUrl,
  HANDLER_MAP
};
