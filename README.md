# Bypass Worker Lite

Cloudflare Worker — **only** hosts from your list that work without a browser.

## Supported
- linkvertise.com (WaitTask / simple)
- mboost.me
- adfoc.us
- paster.so
- link-unlock.com
- bstshrt.com
- linkpays.in
- oii.io

## Not supported (need browser)
Rekonise, SocialWolvez, Sub2Unlock, Zeroin Hub, Lockr, LootLabs, CloverHub, AK Key, Sena Hub, Limbo Hub, Luau.pro, NeoX Softworks

## Deploy
```bash
npm i
npx wrangler login
npx wrangler deploy
```

## Test
```bash
curl "https://bypass-worker-lite.<you>.workers.dev/api/bypass?url=https://mboost.me/..."
curl "https://bypass-worker-lite.<you>.workers.dev/health"
```
