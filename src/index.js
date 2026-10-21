/**
 * Bypass Worker Lite — only hosts that work on pure fetch/GraphQL
 * Supported from your list:
 *   linkvertise.com (WaitTask)
 *   mboost.me
 *   adfoc.us
 *   paster.so
 *   link-unlock.com, bstshrt.com, linkpays.in, oii.io (redirect/extract)
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const SERVICES = {
  linkvertise: {
    hosts: [
      'linkvertise.com', 'linkvertise.net', 'link-center.net', 'link-to.net',
      'direct-link.net', 'file-link.net', 'up-to-down.net', 'link-hub.net',
      'link-target.net', 'lnk.to', 'linkvertise.download'
    ],
    handler: 'linkvertise'
  },
  mboost: {
    hosts: ['mboost.me', 'boost.ink', 'bst.gg', 'booo.st'],
    handler: 'mboost'
  },
  adfoc: {
    hosts: ['adfoc.us', 'adf.ly'],
    handler: 'adfoc'
  },
  paster: {
    hosts: ['paster.so', 'paster.gg'],
    handler: 'paste'
  },
  linkunlock: {
    hosts: ['link-unlock.com'],
    handler: 'generic'
  },
  bstshrt: {
    hosts: ['bstshrt.com'],
    handler: 'generic'
  },
  linkpays: {
    hosts: ['linkpays.in'],
    handler: 'generic'
  },
  oii: {
    hosts: ['oii.io'],
    handler: 'generic'
  }
};

// Not supported on Worker (need browser) — return clear error
const UNSUPPORTED = {
  'rekonise.com': 'Rekonise',
  'socialwolvez.com': 'SocialWolvez',
  'sub2unlock.io': 'Sub2Unlock',
  'sub2unlock.com': 'Sub2Unlock',
  'zeroinhub.com': 'Zeroin Hub',
  'lockr.net': 'Lockr',
  'lootlabs.gg': 'LootLabs',
  'loot-link.com': 'LootLabs',
  'cloverhub.app': 'CloverHub',
  'keysys.absent.wtf': 'AK Key System',
  'senahub.xyz': 'Sena Hub',
  'limbohub.my.id': 'Limbo Hub',
  'luau.pro': 'Luau.pro',
  'neoxsoftworks.eu': 'NeoX Softworks'
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, x-api-key'
    }
  });
}

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function detect(url) {
  const h = hostOf(url);
  for (const [name, cfg] of Object.entries(SERVICES)) {
    if (cfg.hosts.some(x => h === x || h.endsWith('.' + x))) {
      return { key: name, handler: cfg.handler, service: name };
    }
  }
  for (const [dom, label] of Object.entries(UNSUPPORTED)) {
    if (h === dom || h.endsWith('.' + dom)) {
      return { key: null, unsupported: label };
    }
  }
  return { key: null, handler: 'generic', service: 'unknown' };
}

function isLocker(hostname) {
  const h = (hostname || '').toLowerCase();
  for (const cfg of Object.values(SERVICES)) {
    if (cfg.hosts.some(x => h === x || h.endsWith('.' + x))) return true;
  }
  return Object.keys(UNSUPPORTED).some(x => h === x || h.endsWith('.' + x));
}

function isFinal(dest, original) {
  try {
    const a = new URL(dest);
    const b = new URL(original);
    if (a.href.split('#')[0] === b.href.split('#')[0]) return false;
    if (isLocker(a.hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

async function followRedirects(start, max = 8) {
  let current = start;
  for (let i = 0; i < max; i++) {
    const res = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': UA, Accept: 'text/html,application/json,*/*' }
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) break;
      current = new URL(loc, current).href;
      continue;
    }
    const body = await res.text();
    const ctype = res.headers.get('content-type') || '';
    if (ctype.includes('json')) {
      try {
        const j = JSON.parse(body);
        const u = j.destination || j.target || j.url || j.link || j.data?.url || j.data?.target;
        if (u && /^https?:/i.test(u)) return u;
      } catch {}
    }
    const meta = body.match(/content=["']?\d+\s*;\s*url=([^"'\s>]+)/i);
    if (meta) {
      current = new URL(meta[1], current).href;
      continue;
    }
    const js = body.match(/(?:window\.)?location(?:\.href)?\s*=\s*["'](https?:[^"']+)["']/i);
    if (js) {
      current = js[1];
      continue;
    }
    const href = body.match(/href=["'](https?:[^"']+)["'][^>]*(?:get-link|btn|continue|download)/i);
    if (href) return href[1];
    break;
  }
  return current;
}

async function gql(query, variables) {
  const res = await fetch('https://publisher.linkvertise.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Origin: 'https://linkvertise.com',
      Referer: 'https://linkvertise.com/',
      'User-Agent': UA
    },
    body: JSON.stringify({ query, variables })
  });
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors.map(e => e.message).join('; '));
  return data.data;
}

function lvParse(url) {
  const u = new URL(url.replace(/[?&]o=sharing/gi, ''));
  let m = u.pathname.match(/\/(\d+)\/([^/?#]+)/);
  if (m) return { userId: m[1], slug: m[2] };
  m = u.pathname.match(/\/(\d+)/);
  if (m) return { userId: m[1], slug: '' };
  return null;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function bypassLinkvertise(url, deadlineMs) {
  const p = lvParse(url);
  if (!p) return null;
  const input = { userIdAndUrl: { user_id: String(p.userId), url: p.slug || p.userId } };
  const start = Date.now();

  for (let round = 0; round < 6; round++) {
    if (Date.now() - start > deadlineMs - 2000) break;

    const data = await gql(
      `query($input: PublicLinkIdentificationInput!) {
        getContent(input: $input) {
          __typename
          ... on ContentAccessTaskSet {
            tasks {
              id status __typename
              ... on WaitTask { remainingWaitingTime }
            }
          }
          ... on DetailPageTargetData { type url paste }
        }
      }`,
      { input }
    );

    const c = data?.getContent;
    if (!c) break;

    if (c.__typename === 'DetailPageTargetData') {
      const dest = c.url || c.paste;
      if (dest && isFinal(dest, url)) {
        return { success: true, destination: dest, method: 'lv_graphql' };
      }
      break;
    }

    if (c.__typename !== 'ContentAccessTaskSet') break;

    const wait = (c.tasks || []).find(t => t.__typename === 'WaitTask' && t.status !== 'COMPLETED');
    if (wait) {
      const waitMs = Math.min(Math.max((wait.remainingWaitingTime || 1) * 1000, 400), 4000);
      await sleep(waitMs);
      try {
        await gql(
          `mutation($input: PublicLinkIdentificationInput!, $task_id: String!) {
            completeTask(input: $input, task_id: $task_id) { id status }
          }`,
          { input, task_id: wait.id }
        );
      } catch {}
      continue;
    }

    const open = (c.tasks || []).find(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    if (open) {
      try {
        await gql(
          `mutation($input: PublicLinkIdentificationInput!, $task_id: String!) {
            completeTask(input: $input, task_id: $task_id) { id status }
          }`,
          { input, task_id: open.id }
        );
      } catch {}
      await sleep(600);
      continue;
    }
    break;
  }

  // href intermediate
  try {
    const meta = await gql(
      `query($input: PublicLinkIdentificationInput!) {
        linkByIdentifier(linkIdentificationInput: $input) { href target_host }
      }`,
      { input }
    );
    const href = meta?.linkByIdentifier?.href;
    if (href && !href.includes('linkvertise')) {
      const followed = await followRedirects(href, 6);
      if (isFinal(followed, url)) {
        return { success: true, destination: followed, method: 'lv_href_follow' };
      }
    }
  } catch {}

  return null;
}

async function bypassMboost(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json, text/html',
      'X-Requested-With': 'XMLHttpRequest'
    },
    redirect: 'manual'
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) {
      const dest = new URL(loc, url).href;
      if (isFinal(dest, url)) return { success: true, destination: dest, method: 'mboost_redirect' };
    }
  }
  const body = await res.text();
  try {
    const j = JSON.parse(body);
    const u = j.url || j.destination || j.target || j.data?.url;
    if (u && isFinal(u, url)) return { success: true, destination: u, method: 'mboost_json' };
  } catch {}
  const kekw = body.match(/kekw["'\s:=]+([A-Za-z0-9+/=]{12,})/i);
  if (kekw) {
    try {
      const decoded = atob(kekw[1]);
      if (/^https?:/i.test(decoded) && isFinal(decoded, url)) {
        return { success: true, destination: decoded, method: 'mboost_kekw' };
      }
    } catch {}
  }
  const followed = await followRedirects(url, 6);
  if (isFinal(followed, url)) return { success: true, destination: followed, method: 'mboost_follow' };
  return null;
}

function decodeYsmm(ysmm) {
  try {
    let a = '', b = '';
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
    const decoded = atob(mixed.join(''));
    const m = decoded.match(/(https?:\/\/[^\s]+)/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function bypassAdfoc(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    redirect: 'manual'
  });
  if (res.status >= 300 && res.status < 400) {
    const loc = res.headers.get('location');
    if (loc) {
      const dest = new URL(loc, url).href;
      if (isFinal(dest, url)) return { success: true, destination: dest, method: 'adfoc_redirect' };
    }
  }
  const body = await res.text();
  const ysmm = body.match(/var\s+ysmm\s*=\s*['"]([^'"]+)['"]/);
  if (ysmm) {
    const dest = decodeYsmm(ysmm[1]);
    if (dest && isFinal(dest, url)) return { success: true, destination: dest, method: 'adfoc_ysmm' };
  }
  const followed = await followRedirects(url, 6);
  if (isFinal(followed, url)) return { success: true, destination: followed, method: 'adfoc_follow' };
  return null;
}

async function bypassPaste(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  const body = await res.text();
  const text = body.replace(/<[^>]+>/g, '\n');
  for (const line of text.split(/\n/)) {
    const t = line.trim();
    if (/^https?:\/\//i.test(t) && isFinal(t, url)) {
      return { success: true, destination: t, method: 'paste_line' };
    }
  }
  const m = body.match(/https?:\/\/[^\s"'<>]{12,}/);
  if (m && isFinal(m[0], url)) return { success: true, destination: m[0], method: 'paste_extract' };
  return null;
}

async function bypassGeneric(url) {
  const followed = await followRedirects(url, 10);
  if (isFinal(followed, url)) return { success: true, destination: followed, method: 'generic_follow' };
  return null;
}

async function handleBypass(rawUrl, env) {
  const started = Date.now();
  const deadline = parseInt(env.BYPASS_DEADLINE_MS || '20000', 10);
  const det = detect(rawUrl);

  if (det.unsupported) {
    return {
      success: false,
      error: `${det.unsupported} needs a browser engine — not supported on this Worker`,
      code: 'NEEDS_BROWSER',
      service: det.unsupported,
      originalUrl: rawUrl,
      duration: Date.now() - started
    };
  }

  let result = null;
  try {
    switch (det.handler) {
      case 'linkvertise':
        result = await bypassLinkvertise(rawUrl, deadline);
        break;
      case 'mboost':
        result = await bypassMboost(rawUrl);
        break;
      case 'adfoc':
        result = await bypassAdfoc(rawUrl);
        break;
      case 'paste':
        result = await bypassPaste(rawUrl);
        break;
      default:
        result = await bypassGeneric(rawUrl);
    }
  } catch (e) {
    return {
      success: false,
      error: e.message,
      code: 'NETWORK_ERROR',
      service: det.service,
      originalUrl: rawUrl,
      duration: Date.now() - started
    };
  }

  if (result?.success && result.destination) {
    return {
      success: true,
      destination: result.destination,
      method: result.method,
      service: det.service,
      originalUrl: rawUrl,
      isFinal: true,
      duration: Date.now() - started,
      timestamp: new Date().toISOString()
    };
  }

  return {
    success: false,
    error: 'Could not extract final destination',
    code: 'SERVICE_UNAVAILABLE',
    service: det.service || 'unknown',
    originalUrl: rawUrl,
    duration: Date.now() - started,
    timestamp: new Date().toISOString()
  };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'content-type, x-api-key'
        }
      });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '/health') {
      return json({
        ok: true,
        service: 'bypass-worker-lite',
        version: '1.0.0',
        supported: [
          'linkvertise.com (WaitTask)',
          'mboost.me',
          'adfoc.us',
          'paster.so',
          'link-unlock.com',
          'bstshrt.com',
          'linkpays.in',
          'oii.io'
        ],
        unsupported_need_browser: [
          'rekonise.com', 'socialwolvez.com', 'sub2unlock.io', 'zeroinhub.com',
          'lockr.net', 'lootlabs.gg', 'cloverhub.app', 'keysys.absent.wtf',
          'senahub.xyz', 'limbohub.my.id', 'luau.pro', 'neoxsoftworks.eu'
        ]
      });
    }

    if (path === '/api/bypass' || path === '/bypass') {
      let target = url.searchParams.get('url');
      if (request.method === 'POST') {
        try {
          const body = await request.json();
          target = body.url || target;
        } catch {}
      }
      if (!target || !/^https?:\/\//i.test(target)) {
        return json({ success: false, error: 'Missing url', code: 'INVALID_URL' }, 400);
      }
      const result = await handleBypass(target, env);
      return json(result, result.success ? 200 : result.code === 'NEEDS_BROWSER' ? 501 : 422);
    }

    if (path === '/api/services') {
      return json({
        supported: Object.entries(SERVICES).map(([k, v]) => ({ key: k, hosts: v.hosts })),
        unsupported: UNSUPPORTED
      });
    }

    return json({ error: 'Not found' }, 404);
  }
};
