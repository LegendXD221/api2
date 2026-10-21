/**
 * Master service configurations — 88 services
 * type: adlink | keysystem
 */

const SERVICES = {
  // ========== AD LINK SERVICES (49) ==========
  adfocus: {
    name: 'AdFoc.us',
    key: 'adfocus',
    type: 'adlink',
    domains: ["adf.ly","adfoc.us"],
    aliases: ["ay.live"],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: {
      url: /adf\.ly|adfoc\.us/i,
      html: /adfoc|adf\.ly/i
    },
    bypass: { method: 'direct', timeout: 10000 }
  },
  bstlar: {
    name: 'BSTLar',
    key: 'bstlar',
    type: 'adlink',
    domains: ['bstlar.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /bstlar\.com/i, html: /bstlar/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  bstshrt: {
    name: 'BSTShrt',
    key: 'bstshrt',
    type: 'adlink',
    domains: ['bstshrt.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /bstshrt\.com/i, html: /bstshrt/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  bicolink: {
    name: 'Bicolink',
    key: 'bicolink',
    type: 'adlink',
    domains: ['bicolink.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /bicolink\.com/i, html: /bicolink/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  boostink: {
    name: 'Boost.ink',
    key: 'boostink',
    type: 'adlink',
    domains: ["boost.ink"],
    aliases: ["booo.st"],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /boost\.ink/i, html: /boost\.ink/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  boostylink: {
    name: 'Boostylink',
    key: 'boostylink',
    type: 'adlink',
    domains: ['boostylink.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /boostylink\.com/i, html: /boostylink/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  cutty: {
    name: 'Cutty',
    key: 'cutty',
    type: 'adlink',
    domains: ["cutty.ly","cutty.link"],
    aliases: ["cuty.io","cety.io"],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /cutty\.(ly|link)/i, html: /cutty/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  fileshot: {
    name: 'Fileshot',
    key: 'fileshot',
    type: 'adlink',
    domains: ['fileshot.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /fileshot\.com/i, html: /fileshot/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  gaterlnk: {
    name: 'GaterLnk',
    key: 'gaterlnk',
    type: 'adlink',
    domains: ['gaterlnk.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /gaterlnk\.com/i, html: /gaterlnk/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  ghostpaste: {
    name: 'GhostPaste',
    key: 'ghostpaste',
    type: 'adlink',
    domains: ['ghostpaste.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /ghostpaste\.com/i, html: /ghostpaste/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  haxscripts: {
    name: 'HaxScripts',
    key: 'haxscripts',
    type: 'adlink',
    domains: ['haxscripts.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /haxscripts\.com/i, html: /haxscripts/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  justpaste: {
    name: 'JustPaste.it',
    key: 'justpaste',
    type: 'adlink',
    domains: ['justpaste.it'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /justpaste\.it/i, html: /justpaste/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  lnbz: {
    name: 'LNBZ.la',
    key: 'lnbz',
    type: 'adlink',
    domains: ['lnbz.la'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /lnbz\.la/i, html: /lnbz/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  linkunlock: {
    name: 'Link-unlock',
    key: 'linkunlock',
    type: 'adlink',
    domains: ['link-unlock.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /link-unlock\.com/i, html: /link-unlock/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  link4sub: {
    name: 'Link4Sub',
    key: 'link4sub',
    type: 'adlink',
    domains: ["sub2unlock.com"],
    aliases: ["sub2unlock.net"],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /link4sub\.com/i, html: /link4sub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  link4m: {
    name: 'Link4m',
    key: 'link4m',
    type: 'adlink',
    domains: ['link4m.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /link4m\.com/i, html: /link4m/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  linkgate: {
    name: 'LinkGate',
    key: 'linkgate',
    type: 'adlink',
    domains: ['linkgate.net'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /linkgate\.net/i, html: /linkgate/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  linkunlocker: {
    name: 'LinkUnlocker',
    key: 'linkunlocker',
    type: 'adlink',
    domains: ['linkunlocker.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /linkunlocker\.com/i, html: /linkunlocker/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  linkify: {
    name: 'Linkify',
    key: 'linkify',
    type: 'adlink',
    domains: ['linkify.me'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /linkify\.me/i, html: /linkify/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  linkvertise: {
    name: 'Linkvertise',
    key: 'linkvertise',
    type: 'adlink',
    domains: ["linkvertise.com","linkvertise.net","lnk.to"],
    aliases: ["link-center.net","linkvertise.org","direct-link.net","lv.me"],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 5 },
    patterns: {
      url: /linkvertise\.(com|net)|lnk\.to|link-center\.net/i,
      html: /<title>Linkvertise<\/title>|linkvertise/i
    },
    bypass: {
      method: 'api',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      timeout: 15000
    }
  },
  linkzy: {
    name: 'Linkzy',
    key: 'linkzy',
    type: 'adlink',
    domains: ['linkzy.net'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /linkzy\.net/i, html: /linkzy/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  lockr: {
    name: 'Lockr',
    key: 'lockr',
    type: 'adlink',
    domains: ["lockr.me"],
    aliases: ["lockr.so"],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /lockr\.me/i, html: /lockr/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  lootlabs: {
    name: 'LootLabs',
    key: 'lootlabs',
    type: 'adlink',
    domains: ["lootlabs.gg"],
    aliases: ["loot-link.com","lootlinks.com","lootdest.com","lootdest.info"],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /lootlabs\.gg/i, html: /lootlabs/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  mboost: {
    name: 'Mboost',
    key: 'mboost',
    type: 'adlink',
    domains: ["mboost.me"],
    aliases: ["bst.gg"],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /mboost\.me/i, html: /mboost/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  pastered: {
    name: 'Paste.red',
    key: 'pastered',
    type: 'adlink',
    domains: ['paste.red'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /paste\.red/i, html: /paste\.red/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  pasteanon: {
    name: 'PasteAnon',
    key: 'pasteanon',
    type: 'adlink',
    domains: ['pasteanon.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /pasteanon\.com/i, html: /pasteanon/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  pastecry: {
    name: 'PasteCry',
    key: 'pastecry',
    type: 'adlink',
    domains: ['pastecry.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /pastecry\.com/i, html: /pastecry/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  pastedrop: {
    name: 'PasteDrop',
    key: 'pastedrop',
    type: 'adlink',
    domains: ['pastedrop.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /pastedrop\.com/i, html: /pastedrop/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  pastelua: {
    name: 'PasteLua',
    key: 'pastelua',
    type: 'adlink',
    domains: ['pastelua.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /pastelua\.com/i, html: /pastelua/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  pastebin: {
    name: 'Pastebin',
    key: 'pastebin',
    type: 'adlink',
    domains: ['pastebin.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /pastebin\.com/i, html: /pastebin/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  rekonise: {
    name: 'Rekonise',
    key: 'rekonise',
    type: 'adlink',
    domains: ['rekonise.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /rekonise\.com/i, html: /rekonise/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  rentry: {
    name: 'Rentry.org',
    key: 'rentry',
    type: 'adlink',
    domains: ['rentry.org', 'rentry.co'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /rentry\.(org|co)/i, html: /rentry/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  retrievemods: {
    name: 'RetrieveMods',
    key: 'retrievemods',
    type: 'adlink',
    domains: ['retrievemods.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /retrievemods\.com/i, html: /retrievemods/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  rinku: {
    name: 'Rinku',
    key: 'rinku',
    type: 'adlink',
    domains: ['rinku.me'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /rinku\.me/i, html: /rinku/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  sfl: {
    name: 'SFL.gl',
    key: 'sfl',
    type: 'adlink',
    domains: ['sfl.gl'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /sfl\.gl/i, html: /sfl\.gl/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  scriptpastebin: {
    name: 'ScriptPastebin',
    key: 'scriptpastebin',
    type: 'adlink',
    domains: ['scriptpastebin.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: false, maxHops: 1 },
    patterns: { url: /scriptpastebin\.com/i, html: /scriptpastebin/i },
    bypass: { method: 'direct', timeout: 8000 }
  },
  shortener: {
    name: 'Shortener',
    key: 'shortener',
    type: 'adlink',
    domains: ['shortener.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /shortener\.gg/i, html: /shortener/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  shortxlinks: {
    name: 'Shortxlinks',
    key: 'shortxlinks',
    type: 'adlink',
    domains: ['shortxlinks.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /shortxlinks\.com/i, html: /shortxlinks/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  socialwolvez: {
    name: 'SocialWolvez',
    key: 'socialwolvez',
    type: 'adlink',
    domains: ['socialwolvez.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /socialwolvez\.com/i, html: /socialwolvez/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  sub: {
    name: 'Sub',
    key: 'sub',
    type: 'adlink',
    domains: ['sub2unlock.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /sub2unlock\.com/i, html: /sub2unlock/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  sub2boost: {
    name: 'Sub2Boost',
    key: 'sub2boost',
    type: 'adlink',
    domains: ['sub2boost.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /sub2boost\.com/i, html: /sub2boost/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  sub4unlock: {
    name: 'Sub4Unlock Pro',
    key: 'sub4unlock',
    type: 'adlink',
    domains: ['sub4unlock.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /sub4unlock\.com/i, html: /sub4unlock/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  unlocknow: {
    name: 'UnlockNow',
    key: 'unlocknow',
    type: 'adlink',
    domains: ['unlocknow.net'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /unlocknow\.net/i, html: /unlocknow/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  ytsubme: {
    name: 'YTSubMe',
    key: 'ytsubme',
    type: 'adlink',
    domains: ['ytsub.me'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /ytsub\.me/i, html: /ytsub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  exeio: {
    name: 'exe.io',
    key: 'exeio',
    type: 'adlink',
    domains: ["exe.io"],
    aliases: ["exey.io","exee.io"],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /exe\.io/i, html: /exe\.io/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  nexhubser: {
    name: 'nexhubser-api',
    key: 'nexhubser',
    type: 'adlink',
    domains: ['nexhubser-api.vercel.app'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /nexhubser-api\.vercel\.app/i, html: /nexhub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  subnise: {
    name: 'subnise',
    key: 'subnise',
    type: 'adlink',
    domains: ['subnise.com', 'subnise'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /subnise/i, html: /subnise/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  tpi: {
    name: 'tpi.li',
    key: 'tpi',
    type: 'adlink',
    domains: ['tpi.li'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /tpi\.li/i, html: /tpi\.li/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  zeroinhub: {
    name: 'zeroinhub.com',
    key: 'zeroinhub',
    type: 'adlink',
    domains: ['zeroinhub.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /zeroinhub\.com/i, html: /zeroinhub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },

  // ========== KEY SYSTEMS (39) ==========
  absent: {
    name: 'Absent',
    key: 'absent',
    type: 'keysystem',
    domains: ['absent.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /absent/i, html: /absent/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  axon: {
    name: 'Axon',
    key: 'axon',
    type: 'keysystem',
    domains: ['axon.wtf'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /axon/i, html: /axon/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  bloxhub: {
    name: 'BloxHub',
    key: 'bloxhub',
    type: 'keysystem',
    domains: ['bloxhub.org'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /bloxhub/i, html: /bloxhub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  cmhub: {
    name: 'CM Hub',
    key: 'cmhub',
    type: 'keysystem',
    domains: ['cmhub.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /cmhub/i, html: /cmhub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  centuscript: {
    name: 'CentuScript',
    key: 'centuscript',
    type: 'keysystem',
    domains: ['centuscript.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /centuscript/i, html: /centuscript/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  cloverhub: {
    name: 'CloverHub',
    key: 'cloverhub',
    type: 'keysystem',
    domains: ['cloverhub.net'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /cloverhub/i, html: /cloverhub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  codex: {
    name: 'Codex',
    key: 'codex',
    type: 'keysystem',
    domains: ['codex.lol'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /codex/i, html: /codex/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  cokeboys: {
    name: 'Cokeboys Linkvertise',
    key: 'cokeboys',
    type: 'keysystem',
    domains: ['cokeboys.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 5 },
    patterns: { url: /cokeboys/i, html: /cokeboys/i },
    bypass: { method: 'direct', timeout: 15000 }
  },
  deltaandroid: {
    name: 'Delta Android',
    key: 'deltaandroid',
    type: 'keysystem',
    domains: ['deltaexecutor.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /delta/i, html: /delta/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  earnlinks: {
    name: 'EarnLinks.in',
    key: 'earnlinks',
    type: 'keysystem',
    domains: ['earnlinks.in'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /earnlinks\.in/i, html: /earnlinks/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  flowauth: {
    name: 'FlowAuth',
    key: 'flowauth',
    type: 'keysystem',
    domains: ['flowauth.xyz'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /flowauth/i, html: /flowauth/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  getgold: {
    name: 'GetGold',
    key: 'getgold',
    type: 'keysystem',
    domains: ['getgold.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /getgold/i, html: /getgold/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  h4xscripts: {
    name: 'H4xScripts',
    key: 'h4xscripts',
    type: 'keysystem',
    domains: ['h4xscripts.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /h4xscripts/i, html: /h4xscripts/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  hohohub: {
    name: 'HoHo Hub Key System',
    key: 'hohohub',
    type: 'keysystem',
    domains: ['hohohub.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /hohohub/i, html: /hohohub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  keyrblx: {
    name: 'KeyRBLX',
    key: 'keyrblx',
    type: 'keysystem',
    domains: ['keyrblx.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 5 },
    patterns: { url: /keyrblx\.com/i, html: /keyrblx/i },
    bypass: { method: 'api', timeout: 15000 }
  },
  limbohub: {
    name: 'LimboHub',
    key: 'limbohub',
    type: 'keysystem',
    domains: ['limbohub.xyz'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /limbohub/i, html: /limbohub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  luaarmor: {
    name: 'Lua Armor',
    key: 'luaarmor',
    type: 'keysystem',
    domains: ['luaarmor.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /luaarmor/i, html: /luaarmor/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  madium: {
    name: 'Madium',
    key: 'madium',
    type: 'keysystem',
    domains: ['madium.xyz'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /madium/i, html: /madium/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  molyn: {
    name: 'Molyn',
    key: 'molyn',
    type: 'keysystem',
    domains: ['molyn.xyz'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /molyn/i, html: /molyn/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  mykeysystem: {
    name: 'MyKeySystem',
    key: 'mykeysystem',
    type: 'keysystem',
    domains: ['mykeysystem.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /mykeysystem/i, html: /mykeysystem/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  nrlscript: {
    name: 'NRL Script',
    key: 'nrlscript',
    type: 'keysystem',
    domains: ['nrlscript.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /nrlscript/i, html: /nrlscript/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  neoxsoftworks: {
    name: 'NeoxSoftworks',
    key: 'neoxsoftworks',
    type: 'keysystem',
    domains: ['neoxsoftworks.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /neoxsoftworks/i, html: /neoxsoftworks/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  nexhub: {
    name: 'NexHub',
    key: 'nexhub',
    type: 'keysystem',
    domains: ['nexhub.gg', 'nexhubser-api.vercel.app'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 5 },
    patterns: { url: /nexhub/i, html: /nexhub/i },
    bypass: { method: 'api', timeout: 15000 }
  },
  orcakey: {
    name: 'Orca Key System',
    key: 'orcakey',
    type: 'keysystem',
    domains: ['orca.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /orca/i, html: /orca/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  ouo: {
    name: 'Ouo.io',
    key: 'ouo',
    type: 'keysystem',
    domains: ["ouo.io","ouo.press"],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /ouo\.(io|press)/i, html: /ouo/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  pandaantibypass: {
    name: 'PandaAntiBypass',
    key: 'pandaantibypass',
    type: 'keysystem',
    domains: ['pandaantibypass.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /pandaantibypass/i, html: /panda/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  pandadevelopment: {
    name: 'PandaDevelopment',
    key: 'pandadevelopment',
    type: 'keysystem',
    domains: ['pandadevelopment.net'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /pandadevelopment/i, html: /panda/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  platorelay: {
    name: 'PlatoRelay',
    key: 'platorelay',
    type: 'keysystem',
    domains: ['platorelay.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /platorelay/i, html: /platorelay/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  relzhub: {
    name: 'RelzHub',
    key: 'relzhub',
    type: 'keysystem',
    domains: ['relzhub.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /relzhub/i, html: /relzhub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  rifton: {
    name: 'Rifton',
    key: 'rifton',
    type: 'keysystem',
    domains: ['rifton.xyz'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /rifton/i, html: /rifton/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  sift: {
    name: 'Sift',
    key: 'sift',
    type: 'keysystem',
    domains: ['sift.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /sift/i, html: /sift/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  syshub: {
    name: 'SysHub',
    key: 'syshub',
    type: 'keysystem',
    domains: ['syshub.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /syshub/i, html: /syshub/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  teddyhub: {
    name: 'Teddy Hub',
    key: 'teddyhub',
    type: 'keysystem',
    domains: ['teddyhub.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /teddyhub/i, html: /teddyhub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  trigon: {
    name: 'Trigon',
    key: 'trigon',
    type: 'keysystem',
    domains: ['trigon.gg'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /trigon/i, html: /trigon/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  violated: {
    name: 'Violated.lol',
    key: 'violated',
    type: 'keysystem',
    domains: ['violated.lol'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /violated\.lol/i, html: /violated/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  weretools: {
    name: 'Weretools',
    key: 'weretools',
    type: 'keysystem',
    domains: ['weretools.com'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /weretools/i, html: /weretools/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  zeroinhubkey: {
    name: 'Zeroin Hub',
    key: 'zeroinhubkey',
    type: 'keysystem',
    domains: ['zeroinhub.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /zeroinhub/i, html: /zeroinhub/i },
    bypass: { method: 'direct', timeout: 12000 }
  },
  luaupro: {
    name: 'luau.pro',
    key: 'luaupro',
    type: 'keysystem',
    domains: ['luau.pro'],
    aliases: [],
    hasTurnstile: false,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 3 },
    patterns: { url: /luau\.pro/i, html: /luau/i },
    bypass: { method: 'direct', timeout: 10000 }
  },
  rblxscripthub: {
    name: 'rblxscripthub.com',
    key: 'rblxscripthub',
    type: 'keysystem',
    domains: ['rblxscripthub.com'],
    aliases: [],
    hasTurnstile: true,
    requiresProxy: false,
    multiHop: { enabled: true, maxHops: 4 },
    patterns: { url: /rblxscripthub\.com/i, html: /rblxscripthub/i },
    bypass: { method: 'direct', timeout: 12000 }
  }
};

function getServiceByKey(key) {
  return SERVICES[key] || null;
}

function getServiceByDomain(hostname) {
  if (!hostname) return null;
  const host = hostname.toLowerCase().replace(/^www\./, '');
  // Direct domain / alias on service rows
  for (const svc of Object.values(SERVICES)) {
    if ((svc.domains || []).some(d => host === d || host.endsWith('.' + d))) return svc;
    if ((svc.aliases || []).some(a => host === a || host.endsWith('.' + a))) return svc;
  }
  // Fallback via static/auto alias map (lazy require to avoid cycles at load)
  try {
    const { resolveAlias } = require('./aliases');
    const canonical = resolveAlias(host);
    if (canonical && canonical !== host) {
      for (const svc of Object.values(SERVICES)) {
        if ((svc.domains || []).some(d => canonical === d || canonical.endsWith('.' + d))) return svc;
      }
    }
  } catch (_) {}
  return null;
}

function listServices() {
  return Object.values(SERVICES).map(s => ({
    name: s.name,
    key: s.key,
    type: s.type,
    domains: s.domains,
    hasTurnstile: s.hasTurnstile
  }));
}

function countByType() {
  const ad = Object.values(SERVICES).filter(s => s.type === 'adlink').length;
  const key = Object.values(SERVICES).filter(s => s.type === 'keysystem').length;
  return { adlink: ad, keysystem: key, total: ad + key };
}

module.exports = {
  SERVICES,
  getServiceByKey,
  getServiceByDomain,
  listServices,
  countByType
};
