'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const requestManager = require('../utils/request');
const stealth = require('../utils/stealth');
const { buildEvasionHeaders } = require('../utils/antiBot');
const { redirectResolver } = require('../utils/redirectResolver');
const logger = require('../utils/logger');

// ── Dispatch ──────────────────────────────────────────────────────────────────
async function dispatch(svc, url) {
  switch (svc.bypass.method) {
    case 'linkvertise':    return bypassLinkvertise(svc, url);
    case 'boostink':       return bypassBoostInk(svc, url);
    case 'lootlabs':       return bypassLootLabs(svc, url);
    case 'exeio':          return bypassExeIo(svc, url);
    case 'ouoio':          return bypassOuoIo(svc, url);
    case 'link4m':         return bypassLink4m(svc, url);
    case 'rekonise':       return bypassRekonise(svc, url);
    case 'justpaste':      return bypassJustPaste(svc, url);
    case 'pastebin':       return bypassPastebin(svc, url);
    case 'sub2unlock':     return bypassSub2Unlock(svc, url);
    case 'luaarmor':       return bypassLuaArmor(svc, url);
    case 'nexhub':         return bypassNexHub(svc, url);
    case 'codex':          return bypassCodex(svc, url);
    case 'delta':          return bypassDelta(svc, url);
    case 'api':            return bypassViaApi(svc, url);
    case 'keysystem_chain':return bypassKeySystemChain(svc, url);
    case 'direct':
    default:               return bypassDirect(svc, url);
  }
}

async function bypassWithToken(svc, url, token) {
  const headers = buildEvasionHeaders(url, 'high');
  headers['cf-turnstile-response'] = token;
  headers['x-turnstile-token'] = token;
  try {
    const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
    const destination = extractDestination(res.data, url);
    return { destination, resolvedUrl: url, method: 'token_bypass', status: res.status };
  } catch (err) {
    throw new Error(`Token bypass failed: ${err.message}`);
  }
}

// ── Individual service handlers ────────────────────────────────────────────────

async function bypassDirect(svc, url) {
  const headers = buildEvasionHeaders(url, 'medium');
  const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
  const destination = extractDestination(res.data, url);
  return { destination, resolvedUrl: url, method: 'direct', status: res.status };
}

async function bypassLinkvertise(svc, url) {
  // Linkvertise uses a JS challenge + HWID validation; bypass via API extraction
  const headers = buildEvasionHeaders(url, 'maximum');
  headers['referer'] = 'https://linkvertise.com/';

  const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
  const $ = cheerio.load(res.data);

  // Extract the target from the __NUXT__ payload or meta redirect
  let destination = null;

  const nuxtMatch = res.data.match(/"destination"\s*:\s*"([^"]+)"/);
  if (nuxtMatch?.[1]) destination = nuxtMatch[1].replace(/\\u002F/g, '/');

  if (!destination) {
    const metaRedirect = $('meta[http-equiv="refresh"]').attr('content');
    if (metaRedirect) {
      const m = metaRedirect.match(/url=(.+)$/i);
      if (m?.[1]) destination = m[1].trim();
    }
  }

  if (!destination) destination = await resolveViaChain(url);
  return { destination, resolvedUrl: url, method: 'linkvertise', status: res.status };
}

async function bypassBoostInk(svc, url) {
  const headers = buildEvasionHeaders(url, 'high');
  const chain = await redirectResolver(url);
  // boost.ink final hop lands on the destination
  const destination = chain.find(u => !u.includes('boost.ink')) || chain[chain.length - 1];
  return { destination, resolvedUrl: chain[chain.length - 2] || url, method: 'boostink', status: 200 };
}

async function bypassLootLabs(svc, url) {
  // LootLabs uses a task-wall gate; direct follow of redirect chain after Turnstile
  const headers = buildEvasionHeaders(url, 'high');
  const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
  const $ = cheerio.load(res.data);
  const ogUrl = $('meta[property="og:url"]').attr('content') || url;
  const chain = await redirectResolver(ogUrl);
  return {
    destination: chain[chain.length - 1],
    resolvedUrl: ogUrl,
    method: 'lootlabs',
    status: res.status
  };
}

async function bypassExeIo(svc, url) {
  const headers = buildEvasionHeaders(url, 'high');
  const match = url.match(/exe\.io\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error('exe.io: could not extract slug');
  const slug = match[1];
  const apiUrl = `https://exe.io/api?api=${slug}&format=json`;
  const res = await axios.get(apiUrl, { headers, timeout: 10000 });
  if (res.data?.destination) return { destination: res.data.destination, method: 'exeio', status: 200 };
  throw new Error('exe.io API returned no destination');
}

async function bypassOuoIo(svc, url) {
  // ouo.io bypass: pass through the 2-step cookie challenge
  const headers = buildEvasionHeaders(url, 'medium');
  const res1 = await requestManager.get(url, { headers, timeout: 10000 });
  const $ = cheerio.load(res1.data);

  const formAction = $('form').attr('action') || url;
  const formData = new URLSearchParams();
  $('form input').each((_i, el) => {
    const name = $(el).attr('name');
    const value = $(el).attr('value') || '';
    if (name) formData.append(name, value);
  });

  const headers2 = { ...headers, 'content-type': 'application/x-www-form-urlencoded', 'referer': url };
  const res2 = await requestManager.post(formAction, formData.toString(), { headers: headers2, timeout: 10000 });
  const destination = extractDestination(res2.data, url);
  return { destination, resolvedUrl: url, method: 'ouoio', status: res2.status };
}

async function bypassLink4m(svc, url) {
  const headers = buildEvasionHeaders(url, 'medium');
  const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
  const $ = cheerio.load(res.data);
  const destination = $('a#skip-btn').attr('href') || extractDestination(res.data, url);
  return { destination, resolvedUrl: url, method: 'link4m', status: res.status };
}

async function bypassRekonise(svc, url) {
  const headers = buildEvasionHeaders(url, 'medium');
  const match = url.match(/rekonise\.com\/([a-zA-Z0-9-]+)/);
  if (!match) throw new Error('Rekonise: could not extract ID');
  const id = match[1];
  const apiUrl = `https://api.rekonise.com/social-unlocks/${id}`;
  const res = await axios.get(apiUrl, { headers, timeout: 10000 });
  if (res.data?.url) return { destination: res.data.url, method: 'rekonise', status: 200 };
  throw new Error('Rekonise API returned no URL');
}

async function bypassJustPaste(svc, url) {
  const headers = buildEvasionHeaders(url, 'low');
  const res = await requestManager.get(url, { headers, timeout: 10000 });
  const $ = cheerio.load(res.data);
  // JustPaste.it is a content host; just return the raw page URL as destination
  return { destination: url, resolvedUrl: url, method: 'justpaste', status: res.status };
}

async function bypassPastebin(svc, url) {
  // Convert to raw
  const raw = url.replace('pastebin.com/', 'pastebin.com/raw/');
  const headers = buildEvasionHeaders(raw, 'low');
  const res = await requestManager.get(raw, { headers, timeout: 10000 });
  return { destination: raw, resolvedUrl: url, method: 'pastebin', status: res.status };
}

async function bypassSub2Unlock(svc, url) {
  const headers = buildEvasionHeaders(url, 'medium');
  const chain = await redirectResolver(url);
  return {
    destination: chain[chain.length - 1],
    resolvedUrl: chain[chain.length - 2] || url,
    method: 'sub2unlock',
    status: 200
  };
}

async function bypassLuaArmor(svc, url) {
  const headers = buildEvasionHeaders(url, 'high');
  const match = url.match(/luaarmor\.net\/(key|checkpoint)\/([a-zA-Z0-9-]+)/);
  if (!match) return bypassKeySystemChain(svc, url);

  // LuaArmor provides a public API for checkpoint validation
  const id = match[2];
  const apiRes = await axios.get(`https://luaarmor.net/api/validate?id=${id}`, {
    headers, timeout: 10000
  });
  const key = apiRes.data?.key || apiRes.data?.result;
  return { destination: key || url, resolvedUrl: url, method: 'luaarmor', status: 200 };
}

async function bypassNexHub(svc, url) {
  const headers = buildEvasionHeaders(url, 'high');
  const res = await requestManager.get(url, { headers, timeout: svc.bypass.timeout });
  const match = res.data.match(/var\s+redirect\s*=\s*["']([^"']+)["']/);
  if (match?.[1]) return { destination: match[1], method: 'nexhub', status: res.status };
  const chain = await redirectResolver(url);
  return { destination: chain[chain.length - 1], method: 'nexhub', status: 200 };
}

async function bypassCodex(svc, url) {
  // Codex chains through Linkvertise; resolve the full chain
  const chain = await redirectResolver(url);
  return { destination: chain[chain.length - 1], method: 'codex', status: 200 };
}

async function bypassDelta(svc, url) {
  const headers = buildEvasionHeaders(url, 'high');
  const chain = await redirectResolver(url);
  return { destination: chain[chain.length - 1], method: 'delta', status: 200 };
}

async function bypassViaApi(svc, url) {
  const headers = buildEvasionHeaders(url, 'low');
  const res = await axios.get(url, { headers, timeout: svc.bypass.timeout });
  const destination = res.data?.destination || res.data?.url || res.data;
  return { destination: typeof destination === 'string' ? destination : url, method: 'api', status: res.status };
}

async function bypassKeySystemChain(svc, url) {
  // Generic: follow the redirect chain through Linkvertise/ad-link hops
  const chain = await redirectResolver(url);
  const destination = chain[chain.length - 1];
  return { destination, resolvedUrl: chain[chain.length - 2] || url, method: 'keysystem_chain', status: 200 };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractDestination(html, fallback) {
  if (!html || typeof html !== 'string') return fallback;
  const $  = cheerio.load(html);

  // Meta refresh
  const meta = $('meta[http-equiv="refresh"]').attr('content');
  if (meta) { const m = meta.match(/url=(.+)$/i); if (m) return m[1].trim(); }

  // og:url
  const og = $('meta[property="og:url"]').attr('content');
  if (og) return og;

  // Inline JS window.location
  const jsMatch = html.match(/window\.location(?:\.href)?\s*=\s*["']([^"']+)["']/);
  if (jsMatch) return jsMatch[1];

  // Link rel=canonical
  const canonical = $('link[rel="canonical"]').attr('href');
  if (canonical) return canonical;

  return fallback;
}

async function resolveViaChain(url) {
  const chain = await redirectResolver(url);
  return chain[chain.length - 1];
}

module.exports = { dispatch, bypassWithToken };
