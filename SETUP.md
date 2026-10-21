# Setup Guide — Bypass API v3.0.0

## Local

1. Node 18+
2. `cp .env.example .env` — set `API_KEY` if you want auth
3. `npm install`
4. `npm start` or `npm run dev`
5. `curl http://localhost:3000/health`

Optional Redis: set `REDIS_URL=redis://127.0.0.1:6379`.

## Vercel

1. Install CLI: `npm i -g vercel`
2. From project root: `vercel --prod`
3. Set env vars in Vercel dashboard: `API_KEY`, captcha keys, etc.
4. Memory is 128MB / maxDuration 8s — keep Puppeteer off.

## Docker

```bash
export API_KEY=your-secret
docker compose up -d --build
curl http://localhost:3000/health
```

## CAPTCHA keys

Without external keys the solver falls back to configured Turnstile proxies only. For production:

- 2Captcha: https://2captcha.com
- Anti-Captcha: https://anti-captcha.com
- Capsolver: https://www.capsolver.com

Set the corresponding `*_API_KEY` env vars.

## Troubleshooting

- **RATE_LIMITED** — raise `API_RATE_LIMIT` / use API key path
- **TURNSTILE_FAILED** — add solver keys or private proxy
- **SERVICE_UNAVAILABLE** — target changed protection; check `/api/updates` and refresh service config
- Cold start on Vercel — first request may be slower; cache helps subsequent hits
