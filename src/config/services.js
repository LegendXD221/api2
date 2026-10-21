'use strict';

// Master service list — 49 adlinks + 39 key systems
const SERVICES = [
  // ── AD LINK SERVICES ──────────────────────────────────────────────────────
  {
    name: 'Linkvertise', key: 'linkvertise', type: 'adlink',
    domains: ['linkvertise.com', 'linkvertise.net', 'lnk.to'],
    aliases: ['link-center.net', 'linkvertise.net'],
    hasTurnstile: true, requiresProxy: false,
    multiHop: { enabled: true, maxHops: 5 },
    patterns: { url: /linkvertise\.com\/(go|redirect|[0-9]+)/ },
    bypass: { method: 'linkvertise', timeout: 15000 }
  },
  {
    name: 'AdFoc.us', key: 'adfoc', type: 'adlink',
    domains: ['adfoc.us'], aliases: [],
    hasTurnstile: false, requiresProxy: false,
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'BSTLar', key: 'bstlar', type: 'adlink',
    domains: ['bstlar.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'BSTShrt', key: 'bstshrt', type: 'adlink',
    domains: ['bstshrt.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Bicolink', key: 'bicolink', type: 'adlink',
    domains: ['bicolink.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Boost.ink', key: 'boostink', type: 'adlink',
    domains: ['boost.ink'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'boostink', timeout: 12000 }
  },
  {
    name: 'Boostylink', key: 'boostylink', type: 'adlink',
    domains: ['boostylink.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Cutty', key: 'cutty', type: 'adlink',
    domains: ['cutty.app', 'cutty.cc'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Fileshot', key: 'fileshot', type: 'adlink',
    domains: ['fileshot.info'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'GaterLnk', key: 'gaterlnk', type: 'adlink',
    domains: ['gaterlnk.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'GhostPaste', key: 'ghostpaste', type: 'adlink',
    domains: ['ghostpaste.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'HaxScripts', key: 'haxscripts', type: 'adlink',
    domains: ['haxscripts.com', 'haxscript.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'JustPaste.it', key: 'justpaste', type: 'adlink',
    domains: ['justpaste.it'], aliases: [],
    bypass: { method: 'justpaste', timeout: 10000 }
  },
  {
    name: 'LNBZ.la', key: 'lnbz', type: 'adlink',
    domains: ['lnbz.la'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Link-unlock', key: 'linkunlock', type: 'adlink',
    domains: ['link-unlock.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Link4Sub', key: 'link4sub', type: 'adlink',
    domains: ['link4sub.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Link4m', key: 'link4m', type: 'adlink',
    domains: ['link4m.org', 'link4m.net'], aliases: [],
    bypass: { method: 'link4m', timeout: 12000 }
  },
  {
    name: 'LinkGate', key: 'linkgate', type: 'adlink',
    domains: ['linkgate.cc'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'LinkUnlocker', key: 'linkunlocker', type: 'adlink',
    domains: ['linkunlocker.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Linkify', key: 'linkify', type: 'adlink',
    domains: ['linkify.cc', 'linkify.gg'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Linkzy', key: 'linkzy', type: 'adlink',
    domains: ['linkzy.co'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Lockr', key: 'lockr', type: 'adlink',
    domains: ['lockr.pro'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'LootLabs', key: 'lootlabs', type: 'adlink',
    domains: ['loot-labs.com', 'lootlabs.gg'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'lootlabs', timeout: 15000 }
  },
  {
    name: 'Mboost', key: 'mboost', type: 'adlink',
    domains: ['mboost.me'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Paste.red', key: 'pastered', type: 'adlink',
    domains: ['paste.red'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'PasteAnon', key: 'pasteanon', type: 'adlink',
    domains: ['pasteanon.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'PasteCry', key: 'pastecry', type: 'adlink',
    domains: ['pastecry.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'PasteDrop', key: 'pastedrop', type: 'adlink',
    domains: ['pastedrop.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'PasteLua', key: 'pastelua', type: 'adlink',
    domains: ['pastelua.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Pastebin', key: 'pastebin', type: 'adlink',
    domains: ['pastebin.com'], aliases: [],
    bypass: { method: 'pastebin', timeout: 10000 }
  },
  {
    name: 'Rekonise', key: 'rekonise', type: 'adlink',
    domains: ['rekonise.com'], aliases: [],
    bypass: { method: 'rekonise', timeout: 12000 }
  },
  {
    name: 'Rentry.org', key: 'rentry', type: 'adlink',
    domains: ['rentry.org', 'rentry.co'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'RetrieveMods', key: 'retrievemods', type: 'adlink',
    domains: ['retrievemods.net'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Rinku', key: 'rinku', type: 'adlink',
    domains: ['rinku.cc'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'SFL.gl', key: 'sflgl', type: 'adlink',
    domains: ['sfl.gl'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'ScriptPastebin', key: 'scriptpastebin', type: 'adlink',
    domains: ['scriptpastebin.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Shortener', key: 'shortener', type: 'adlink',
    domains: ['shortener.gg'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Shortxlinks', key: 'shortxlinks', type: 'adlink',
    domains: ['shortxlinks.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'SocialWolvez', key: 'socialwolvez', type: 'adlink',
    domains: ['socialwolvez.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Sub', key: 'sub', type: 'adlink',
    domains: ['sub2unlock.com', 'sub2get.com'], aliases: [],
    bypass: { method: 'sub2unlock', timeout: 12000 }
  },
  {
    name: 'Sub2Boost', key: 'sub2boost', type: 'adlink',
    domains: ['sub2boost.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'Sub4Unlock Pro', key: 'sub4unlock', type: 'adlink',
    domains: ['sub4unlock.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'UnlockNow', key: 'unlocknow', type: 'adlink',
    domains: ['unlocknow.cc', 'unlocknow.net'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'YTSubMe', key: 'ytsubme', type: 'adlink',
    domains: ['ytsubme.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'exe.io', key: 'exeio', type: 'adlink',
    domains: ['exe.io'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'exeio', timeout: 15000 }
  },
  {
    name: 'NexHub Adlink', key: 'nexhubser', type: 'adlink',
    domains: ['nexhubser-api.vercel.app'], aliases: [],
    bypass: { method: 'api', timeout: 10000 }
  },
  {
    name: 'Subnise', key: 'subnise', type: 'adlink',
    domains: ['subnise.com', 'subnise.net'], aliases: ['subnise'],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'tpi.li', key: 'tpili', type: 'adlink',
    domains: ['tpi.li'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },
  {
    name: 'ZeroInHub Adlink', key: 'zeroinhub_ad', type: 'adlink',
    domains: ['zeroinhub.com'], aliases: [],
    bypass: { method: 'direct', timeout: 10000 }
  },

  // ── KEY SYSTEMS ──────────────────────────────────────────────────────────
  {
    name: 'Absent Key', key: 'absent', type: 'keysystem',
    domains: ['absent.gg'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Axon', key: 'axon', type: 'keysystem',
    domains: ['axonhub.org'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'BloxHub', key: 'bloxhub', type: 'keysystem',
    domains: ['bloxhub.gg', 'bloxhub.org'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'CM Hub', key: 'cmhub', type: 'keysystem',
    domains: ['cmhub.gg'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'CentuScript', key: 'centuscript', type: 'keysystem',
    domains: ['centuscript.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'CloverHub', key: 'cloverhub', type: 'keysystem',
    domains: ['cloverhub.lol'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Codex', key: 'codex', type: 'keysystem',
    domains: ['codex.lol', 'codex-executor.com'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'codex', timeout: 25000 }
  },
  {
    name: 'Cokeboys Linkvertise', key: 'cokeboys', type: 'keysystem',
    domains: ['cokeboys.cc'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Delta Android', key: 'delta_android', type: 'keysystem',
    domains: ['deltaexecutor.co'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'delta', timeout: 25000 }
  },
  {
    name: 'EarnLinks.in', key: 'earnlinks', type: 'keysystem',
    domains: ['earnlinks.in'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'FlowAuth', key: 'flowauth', type: 'keysystem',
    domains: ['flowauth.xyz'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'GetGold', key: 'getgold', type: 'keysystem',
    domains: ['getgold.gg'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'H4xScripts', key: 'h4xscripts', type: 'keysystem',
    domains: ['h4xscripts.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'HoHo Hub', key: 'hohohub', type: 'keysystem',
    domains: ['hohohub.gg', 'hohohub.org'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'KeyRBLX', key: 'keyRBLX', type: 'keysystem',
    domains: ['keyRBLX.com', 'keyrblx.com'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'LimboHub', key: 'limbohub', type: 'keysystem',
    domains: ['limbohub.xyz'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Lua Armor', key: 'luaarmor', type: 'keysystem',
    domains: ['luaarmor.net'], aliases: [],
    bypass: { method: 'luaarmor', timeout: 20000 }
  },
  {
    name: 'Madium', key: 'madium', type: 'keysystem',
    domains: ['madium.org'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Molyn', key: 'molyn', type: 'keysystem',
    domains: ['molyn.cc'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'MyKeySystem', key: 'mykeysystem', type: 'keysystem',
    domains: ['mykeysystem.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'NRL Script', key: 'nrlscript', type: 'keysystem',
    domains: ['nrlscript.net'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'NeoxSoftworks', key: 'neoxsoftworks', type: 'keysystem',
    domains: ['neoxsoftworks.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'NexHub', key: 'nexhub', type: 'keysystem',
    domains: ['nexhub.org', 'nexhub.gg'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'nexhub', timeout: 20000 }
  },
  {
    name: 'Orca Key System', key: 'orca', type: 'keysystem',
    domains: ['orca.gg'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Ouo.io', key: 'ouoio', type: 'keysystem',
    domains: ['ouo.io', 'ouo.press'], aliases: [],
    hasTurnstile: false,
    bypass: { method: 'ouoio', timeout: 15000 }
  },
  {
    name: 'PandaAntiBypass', key: 'pandaantibypass', type: 'keysystem',
    domains: ['pandaantibypass.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'PandaDevelopment', key: 'pandadev', type: 'keysystem',
    domains: ['pandadev.net'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'PlatoRelay', key: 'platorelay', type: 'keysystem',
    domains: ['platorelay.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'RelzHub', key: 'relzhub', type: 'keysystem',
    domains: ['relzhub.gg'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Rifton', key: 'rifton', type: 'keysystem',
    domains: ['rifton.net'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Sift', key: 'sift', type: 'keysystem',
    domains: ['sift.gg'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'SysHub', key: 'syshub', type: 'keysystem',
    domains: ['syshub.xyz'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Teddy Hub', key: 'teddyhub', type: 'keysystem',
    domains: ['teddyhub.org'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Trigon', key: 'trigon', type: 'keysystem',
    domains: ['trigon.gg', 'trigonevo.com'], aliases: [],
    hasTurnstile: true,
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Violated.lol', key: 'violated', type: 'keysystem',
    domains: ['violated.lol'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Weretools', key: 'weretools', type: 'keysystem',
    domains: ['weretools.xyz'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'Zeroin Hub', key: 'zeroinhub', type: 'keysystem',
    domains: ['zeroin-hub.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'luau.pro', key: 'luaupro', type: 'keysystem',
    domains: ['luau.pro'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  },
  {
    name: 'rblxscripthub.com', key: 'rblxscripthub', type: 'keysystem',
    domains: ['rblxscripthub.com'], aliases: [],
    bypass: { method: 'keysystem_chain', timeout: 20000 }
  }
];

module.exports = SERVICES;
