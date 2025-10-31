# Fitai – Setup and Deploy (Short Guide)

All-in-one Next.js app with meal planning (Edamam + CAREAI), AI workouts (CAREAI), To‑Do list, and AI music (Sonauto).

## Quick Start

1) Install
- Node 18+ and npm
- PostgreSQL running
- Clone and install:
```
npm install
```

2) Env (.env.local)
- Copy and fill only what you need. Safe defaults use fallbacks/mocks.
```
# Database
DATABASE_URL="postgresql://USER:PASS@HOST:5432/Fitai?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-long-random-string"

# Meal plan (Edamam)
EDAMAM_RECIPE_APP_ID="your-edamam-id"
EDAMAM_RECIPE_APP_KEY="your-edamam-key"

# Gemini for AI (CAREAI)
CAREAI="your-gemini-api-key"

# Funxtion (optional fallback for exercises)
FUNXTION_API_KEY=""
FUNXTION_API_URL="https://api.funxtion.com/v1"

# Music (Sonauto)
MUSICAPI="your-sonauto-api-key"
```
Notes:
- We DO NOT fetch or serve meal images (image fields are nulled in API).
- Workout generation uses CAREAI first; falls back when unavailable.
- Music uses Sonauto v1: POST /generations → poll /generations/{task_id}.

3) DB and run
```
# generate client and sync schema
npx prisma generate
npx prisma db push --accept-data-loss

# dev
npm run dev
```
Open http://localhost:3000

## Deploy (production)
Minimal steps to go live on any Node server/VPS or platform (Vercel, Render, Fly, etc.).

1) Production env vars (set in your host dashboard)
- DATABASE_URL: production Postgres URL
- NEXTAUTH_URL: your https domain, e.g. https://yourdomain.com
- NEXTAUTH_SECRET: long random string
- EDAMAM_RECIPE_APP_ID / EDAMAM_RECIPE_APP_KEY
- CAREAI: Gemini key
- MUSICAPI: Sonauto key
- (Optional) FUNXTION_API_KEY / FUNXTION_API_URL

2) Build and start
```
npm run build
npm run start
```
- Behind a reverse proxy (Nginx/Caddy) point to port 3000
- Ensure Postgres is reachable from the server

3) Prisma on deploy
- Run once after env is set:
```
npx prisma generate
npx prisma db push --accept-data-loss
```

## Feature Notes
- To‑Do list: time-only, daily templates supported; fast toggles
- Meal plan API: AI daily/weekly via CAREAI; Edamam fallback; images stripped server-side
- Workout generator: daily or single-call weekly via CAREAI
- Music generator: Sonauto API; returns a temporary audio URL

## Troubleshooting (very short)
- 401 Unauthorized on APIs → login required or set NEXTAUTH_* correctly
- Prisma type errors → run `npx prisma generate`
- DB schema mismatch → run `npx prisma db push`
- AI empty results → confirm CAREAI/MUSICAPI keys are set in env

