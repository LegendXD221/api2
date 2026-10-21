/**
 * Service bypass strategies — extract + multi-hop + LV publisher API
 * Never treats locker host as final success
 */

const { get, post } = require('../utils/request');
const { resolve, extractNextFromBody } = require('../utils/redirectResolver');
const { getServiceByKey } = require('../config/services');
const { isFinalDestination, isLockerHost, isSameOrLocker } = require('../utils/lockerHosts');
const logger = require('../utils/logger');

function extractDestination(html, baseUrl) {
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

function okResult(destination, method, status, extra = {}) {
  if (!destination || !/^https?:\/\//i.test(destination)) {
    return { success: false, error: 'Invalid destination', code: 'SERVICE_UNAVAILABLE' };
  }
  return {
    success: true,
    destination,
    method,
    status,
    isFinal: isFinalDestination(destination),
    ...extra
  };
}

async function bypassDirect(url, service, opts = {}) {
  const level = opts.level || 'medium';
  let res;
  try {
    res = await get(url, {
      level,
      maxRedirects: 0,
      timeout: service.bypass?.timeout || 12000,
      headers: service.bypass?.headers || {}
    });
  } catch (err) {
    const resolved = await resolve(url, {
      maxHops: service.multiHop?.maxHops || 8,
      level
    });
    if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, url)) {
      const dest = await deepen(resolved.finalUrl, opts);
      return okResult(dest, 'multi_hop_fallback', resolved.status, { chain: resolved.chain });
    }
    return { success: false, error: err.message, code: 'NETWORK_ERROR' };
  }

  const loc = res.headers.location || res.headers.Location;
  if (res.status >= 300 && res.status < 400 && loc) {
    try {
      let dest = new URL(loc, url).href;
      dest = await deepen(dest, opts);
      if (!isSameOrLocker(dest, url)) {
        return okResult(dest, 'redirect', res.status);
      }
    } catch {}
  }

  const body = typeof res.data === 'string' ? res.data : '';
  const extracted = extractDestination(body, url);
  if (extracted && !isSameOrLocker(extracted, url)) {
    const dest = await deepen(extracted, opts);
    return okResult(dest, 'extract', res.status);
  }

  const resolved = await resolve(url, {
    maxHops: service.multiHop?.maxHops || 8,
    level
  });
  if (resolved.success && resolved.finalUrl && !isSameOrLocker(resolved.finalUrl, url)) {
    const dest = await deepen(resolved.finalUrl, opts);
    return okResult(dest, 'multi_hop', resolved.status, { chain: resolved.chain });
  }

  return {
    success: false,
    error: 'Could not extract final destination',
    code: 'SERVICE_UNAVAILABLE',
    status: res.status
  };
}

/**
 * Linkvertise publisher API flow (static → target)
 */
async function bypassLinkvertise(url, service, opts = {}) {
  const level = opts.level || 'high';
  try {
    let work = url
      .replace(/%3D/gi, '=')
      .replace(/&o=sharing/gi, '')
      .replace(/\?o=sharing/gi, '')
      .replace(/dynamic\?r=/i, 'dynamic/?r=');

    const u = new URL(work);
    // id path like /514008/name or /dynamic/...
    const idMatch = u.pathname.match(/\/(\d+)\/[^/]+/) || u.pathname.match(/\/(\d+)(?:\/|$)/);
    const pathPart = idMatch ? idMatch[0].replace(/\/$/, '') : null;

    if (pathPart) {
      const base = 'https://publisher.linkvertise.com/api/v1/redirect/link';
      const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
        Origin: 'https://linkvertise.com',
        Referer: work
      };

      // warmup paths (best-effort)
      for (const suffix of [
        '/captcha',
        '/countdown_impression?trafficOrigin=network',
        '/todo_impression?mobile=true&trafficOrigin=network'
      ]) {
        try {
          await get(`${base}${pathPart}${suffix}`, { level, maxRedirects: 0, timeout: 8000, headers });
        } catch {}
      }

      // static link meta
      let linkId = null;
      try {
        const st = await get(`${base}/static${pathPart}`, {
          level,
          maxRedirects: 0,
          timeout: 10000,
          headers
        });
        const j = JSON.parse(typeof st.data === 'string' ? st.data : '{}');
        linkId = j?.data?.link?.id || j?.data?.id;
      } catch (e) {
        logger.debug('LV static failed', { error: e.message });
      }

      // account token (optional)
      let userToken = null;
      try {
        const acc = await get('https://publisher.linkvertise.com/api/v1/account', {
          level,
          maxRedirects: 0,
          timeout: 8000,
          headers
        });
        const aj = JSON.parse(typeof acc.data === 'string' ? acc.data : '{}');
        userToken = aj.user_token || null;
      } catch {}

      const serialPayload = {
        timestamp: Date.now(),
        random: '6548307',
        link_id: linkId
      };
      const serial = Buffer.from(JSON.stringify(serialPayload)).toString('base64');

      const targetUrl =
        `${base}${pathPart}/target` +
        (userToken ? `?X-Linkvertise-UT=${encodeURIComponent(userToken)}` : '');

      try {
        const tgt = await post(
          targetUrl,
          JSON.stringify({ serial }),
          {
            level,
            maxRedirects: 0,
            timeout: 12000,
            headers
          }
        );
        const body = typeof tgt.data === 'string' ? tgt.data : '';
        try {
          const j = JSON.parse(body);
          const target =
            j?.data?.target ||
            j?.data?.url ||
            j?.target ||
            j?.destination ||
            j?.url;
          if (target && /^https?:/i.test(target) && !isSameOrLocker(target, work)) {
            const dest = await deepen(target, opts);
            return okResult(dest, 'linkvertise_target', tgt.status);
          }
        } catch {}
        const extracted = extractDestination(body, work);
        if (extracted && !isSameOrLocker(extracted, work)) {
          const dest = await deepen(extracted, opts);
          return okResult(dest, 'linkvertise_extract', tgt.status);
        }
      } catch (e) {
        logger.debug('LV target failed', { error: e.message });
      }
    }

    // candidate soft endpoints
    const candidates = [
      work,
      work.replace(/\/$/, '') + '/dynamic',
      pathPart ? `https://publisher.linkvertise.com/api/v1/redirect/link${pathPart}` : null
    ].filter(Boolean);

    for (const c of candidates) {
      try {
        const res = await get(c, {
          level,
          maxRedirects: 0,
          timeout: 12000,
          headers: {
            Accept: 'application/json, text/plain, */*',
            'X-Requested-With': 'XMLHttpRequest',
            Referer: work
          }
        });
        const body = typeof res.data === 'string' ? res.data : '';
        try {
          const j = JSON.parse(body);
          const target =
            j?.data?.target || j?.destination || j?.url || j?.link || j?.target;
          if (target && /^https?:/i.test(target) && !isSameOrLocker(target, work)) {
            const dest = await deepen(target, opts);
            return okResult(dest, 'linkvertise_api', res.status);
          }
        } catch {}
        const dest0 = extractDestination(body, work);
        if (dest0 && !isSameOrLocker(dest0, work)) {
          const dest = await deepen(dest0, opts);
          return okResult(dest, 'linkvertise_extract', res.status);
        }
      } catch {}
    }
  } catch (err) {
    logger.debug('Linkvertise path failed', { error: err.message });
  }
  return bypassDirect(url, service, opts);
}

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
        let dest = new URL(loc, url).href;
        dest = await deepen(dest, opts);
        if (!isSameOrLocker(dest, url)) {
          return okResult(dest, 'ouo_form', res2.status);
        }
      }
      const extracted = extractDestination(
        typeof res2.data === 'string' ? res2.data : '',
        url
      );
      if (extracted && !isSameOrLocker(extracted, url)) {
        const dest = await deepen(extracted, opts);
        return okResult(dest, 'ouo_extract', res2.status);
      }
    }
  } catch (err) {
    logger.debug('ouo form failed', { error: err.message });
  }
  if (first.success) return first;
  return { success: false, error: 'ouo bypass failed', code: 'SERVICE_UNAVAILABLE' };
}

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
    try {
      const j = JSON.parse(body);
      const target = j?.url || j?.destination || j?.target || j?.data?.url;
      if (target && !isSameOrLocker(target, url)) {
        const dest = await deepen(target, opts);
        return okResult(dest, 'boost_api', res.status);
      }
    } catch {}
  } catch {}
  return direct;
}

async function bypassByService(url, serviceKey, opts = {}) {
  const service = getServiceByKey(serviceKey);
  if (!service) {
    return { success: false, error: 'Unknown service key', code: 'INVALID_URL' };
  }

  switch (serviceKey) {
    case 'linkvertise':
      return bypassLinkvertise(url, service, opts);
    case 'ouo':
      return bypassOuo(url, service, opts);
    case 'boostink':
    case 'boostylink':
    case 'mboost':
      return bypassBoost(url, service, opts);
    case 'keyrblx':
    case 'nexhub':
    case 'lootlabs':
    case 'rekonise':
    case 'bstlar':
      return bypassDirect(url, service, { ...opts, level: opts.level || 'high' });
    default:
      return bypassDirect(url, service, opts);
  }
}

module.exports = {
  bypassByService,
  bypassDirect,
  extractDestination,
  deepen
};
