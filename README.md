# Bypass API v3.0.0

**88 services · Advanced Anti-Bot · Turnstile Solving · Production-Ready**

## Quick Start

```bash
npm install
cp .env.example .env  # add your API_KEY
npm start
curl "http://localhost:3000/api/bypass?url=https://linkvertise.com/test"
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/bypass?url=URL` | Bypass a link |
| POST | `/api/bypass/batch` | Bypass up to 20 links |
| GET | `/api/resolve?url=URL` | Resolve redirects only |
| GET | `/api/detect?url=URL` | Detect service |
| GET | `/api/services` | List all 88 services |
| GET | `/api/stats` | API statistics |
| GET | `/api/updates` | Update status |
| POST | `/api/turnstile/solve` | Solve Turnstile |
| GET | `/api/turnstile/check?url=URL` | Check for Turnstile |
| POST | `/api/cache/clear` | Clear cache |
| GET | `/health` | Health check |

## Authentication

Set `API_REQUIRE_AUTH=true` and pass `X-API-Key: <your-key>` header.

## Services: 88 total

- **49 Ad link services**: Linkvertise, boost.ink, LootLabs, exe.io, ouo.io, link4m, Rekonise, and 42 more
- **39 Key systems**: Codex, Delta, NexHub, LuaArmor, Absent, BloxHub, Trigon, and 32 more

## Anti-Bot System

12 evasion techniques across 4 levels (low → maximum):
header spoofing, navigator/screen/WebGL/canvas/audio fingerprinting, WebRTC spoofing, behavioral delays, mouse + typing simulation, request header transformation, session management

## CAPTCHA Solving Fallback Chain

1. Internal proxy (if configured)
2. 2Captcha
3. Anti-Captcha
4. Capsolver
5. Manual page-source extraction

All methods with 5-minute token caching and queue deduplication.

## Docker

```bash
docker-compose up -d
```
