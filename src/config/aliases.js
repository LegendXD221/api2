'use strict';

// Domain alias → canonical service key
const ALIASES = {
  'link-center.net': 'linkvertise',
  'linkvertise.net': 'linkvertise',
  'lnk.to': 'linkvertise',
  'ouo.press': 'ouoio',
  'rentry.co': 'rentry',
  'codex-executor.com': 'codex',
  'trigonevo.com': 'trigon',
  'sub2unlock.com': 'sub',
  'sub2get.com': 'sub',
  'bloxhub.org': 'bloxhub',
  'keyrblx.com': 'keyRBLX',
  'nexhub.gg': 'nexhub',
  'subnise': 'subnise',
  'cutty.cc': 'cutty',
  'linkify.gg': 'linkify',
  'link4m.net': 'link4m',
  'haxscript.com': 'haxscripts',
  'deltaexecutor.co': 'delta_android',
  'loot-labs.com': 'lootlabs',
  'unlocknow.net': 'unlocknow',
  'nexhubser-api.vercel.app': 'nexhubser',
  'subnise.com': 'subnise',
  'zeroinhub.com': 'zeroinhub_ad'
};

// Redirect chain patterns — services that hop through known intermediate domains
const REDIRECT_CHAINS = {
  'linkvertise': ['link-center.net', 'linkvertise.com', 'lnk.to'],
  'delta_android': ['ads.deltaexecutor.co', 'deltaexecutor.co'],
  'codex': ['linkvertise.com', 'codex.lol']
};

module.exports = { ALIASES, REDIRECT_CHAINS };
