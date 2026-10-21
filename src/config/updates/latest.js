module.exports = {
  version: '3.0.0',
  lastUpdated: '2026-10-21',
  changes: [
    {
      service: 'core',
      type: 'update',
      note: 'Hard final-destination rule: never success with same/locker URL; deepen multi-hop until non-locker host'
    },
    {
      service: 'aliases',
      type: 'update',
      note: 'Full static + auto alias set (work.ink, loot-link, lockr.so, cuty, boost, ouo.press, link-center, …)'
    },
    {
      service: 'linkvertise',
      type: 'update',
      note: 'Publisher static/target API flow with serial payload + warmup paths'
    },
    {
      service: 'upstream',
      type: 'add',
      note: 'BYPASS_UPSTREAM_URLS templates as last-resort resolver chain'
    }
  ],
  newServices: [],
  removedServices: []
};
