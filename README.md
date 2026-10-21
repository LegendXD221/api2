# Bypass API v3.0.0

Production-ready link bypass API covering **88 services** (49 ad-link + 39 key systems), Turnstile solving, multi-hop redirects, advanced anti-bot evasion, and CAPTCHA fallback chain.

## Features

- Service detection with subdomain aliases (`link-center.net` → Linkvertise, etc.)
- Multi-hop redirect resolution with circular detection
- Turnstile / CAPTCHA: internal proxy → 2Captcha → Anti-Captcha → Capsolver
- 12 anti-bot techniques across 4 levels (low → maximum)
- Stealth headers, UA rotation, fingerprint pools
- Smart cache (success 1h / failure 5min), optional Redis
- Rate limits, API key auth, Helmet, CORS
- Vercel free-plan friendly (128MB, 8s, Puppeteer off)

## Quick start

```bash
cp .env.example .env
npm install
npm start
# http://localhost:3000/health
```

```bash
curl "http://localhost:3000/api/bypass?url=https://linkvertise.com/example"
curl -X POST http://localhost:3000/api/bypass/batch \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://ouo.io/x","https://boost.ink/y"]}'
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/bypass` | Bypass one URL |
| POST | `/api/bypass/batch` | Up to 20 URLs |
| GET | `/api/resolve` | Redirect chain only |
| GET | `/api/detect` | Service detection |
| GET | `/api/services` | List all services |
| GET | `/api/stats` | Cache / captcha / anti-bot stats |
| GET/POST | `/api/updates` | Update status / force check |
| POST | `/api/turnstile/solve` | Solve Turnstile |
| GET | `/api/turnstile/check` | Detect Turnstile |
| POST | `/api/cache/clear` | Clear cache |
| GET | `/health` | Health |

## Environment

See `.env.example`. Important:

- `API_KEY` + `API_REQUIRE_AUTH=true` for protected deploy
- `TWOCAPTCHA_API_KEY` / `ANTICAPTCHA_API_KEY` / `CAPSOLVER_API_KEY`
- `REDIS_URL` for shared cache
- `TURNSTILE_PROXY_*` for private solvers

## Deploy

**Vercel**

```bash
npm i -g vercel
vercel --prod
```

**Docker**

```bash
docker compose up -d
```

## Tests

```bash
npm test
```

## License

MIT
