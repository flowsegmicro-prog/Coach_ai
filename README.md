# Coach AI — MVP

A web app for individual athletes to track training load with scientific rigour: sRPE, ACWR, monotony, strain, and Banister's fitness/fatigue model.

This MVP focuses on:

1. Logging sessions (duration + RPE + discipline)
2. Automatically computing all training-load metrics
3. A dashboard that interprets them (risk zones, alerts)
4. Email/password authentication

Sections like Recovery, Calendar, Nutrition and Medicine are visible in the navigation but marked "Bientôt" — they have no business logic yet.

## Stack

- **Frontend** : React 18 + Vite + TypeScript + Tailwind CSS, Recharts, TanStack Query, React Router, Zod, Sonner
- **Backend** : Node.js + Express + TypeScript, Prisma, PostgreSQL, JWT (httpOnly cookie), bcrypt, Zod
- **Tests** : Vitest (training-load engine)

## Prerequisites

- Node.js **20+**
- PostgreSQL **15+** running locally (or any reachable instance)
- npm 10+

## Setup

```bash
# 1. Clone & install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Backend env vars

Copy `backend/.env.example` to `backend/.env` and adjust:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coach_ai?schema=public"
JWT_SECRET="change-me-to-a-long-random-string"
PORT=4000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
```

### Database migration & seed

```bash
cd backend
npx prisma migrate dev --name init   # creates DB tables
npm run seed                          # creates demo user with 35 days of sessions
```

The seed creates:

- **Email** : `thomas@coach.ai`
- **Password** : `password123`
- 35 days of varied sessions (running, cycling, strength, swimming) so the dashboard immediately has data — including ACWR, monotony, strain and a meaningful Banister curve.

### Run

In two separate terminals:

```bash
# Terminal 1
cd backend && npm run dev
# → http://localhost:4000

# Terminal 2
cd frontend && npm run dev
# → http://localhost:5173
```

The frontend proxies `/api` to the backend, so cookies work out of the box.

## Tests

```bash
cd backend && npm test
```

Covers the entire training-load engine: sRPE, ACWR (and zones), 7-day acute mean, 28-day chronic mean, monotony, strain, Banister, form percentage, and the daily-load series builder.

## Project structure

```
coach-ai/
├── backend/
│   ├── src/
│   │   ├── routes/         # /auth, /sessions, /metrics
│   │   ├── services/       # training-load + metrics
│   │   ├── middleware/     # auth, error
│   │   ├── db/             # prisma client
│   │   └── server.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # ui, dashboard, sessions, layout
│   │   ├── pages/          # Dashboard, Sessions, LoadPerformance, Analyses, ...
│   │   ├── lib/            # api client, utils
│   │   ├── hooks/
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## API summary

### Auth (cookie `coach_token`)

- `POST /api/auth/register` `{ email, password, firstName, lastName }`
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

### Sessions

- `POST   /api/sessions`
- `GET    /api/sessions?from=&to=&discipline=&limit=`
- `GET    /api/sessions/:id`
- `PATCH  /api/sessions/:id`
- `DELETE /api/sessions/:id`

### Metrics

- `GET /api/metrics/dashboard` — everything the dashboard needs
- `GET /api/metrics/history?days=7|30|90` — daily load / acute / chronic / Banister
- `GET /api/metrics/weekly?weeks=12` — weekly recap for the Analyses page

## Scientific notes

- **sRPE**: `load = duration_min × RPE` (Foster 1998)
- **CA** (acute load): rolling mean of daily loads over **7 days** (missing days = 0)
- **CC** (chronic load): rolling mean of daily loads over **28 days**
- **RCAC** (ACWR): `CA / CC`. Zones: `<0.8` sous-charge, `0.8–1.3` optimale, `1.3–1.5` vigilance, `>1.5` risque
- **Monotony** (Foster): `mean(weekly) / sd(weekly)`. `<1.5` ok, `1.5–2.0` vigilance, `>2.0` risque. Returns null if sd = 0.
- **Strain**: `weeklyTotalLoad × monotony`
- **Banister** (impulse–response): `fitness[t] = fitness[t-1] × exp(-1/τfitness) + load[t]`, idem fatigue. `form = fitness − k × fatigue` with τfitness = 42j, τfatigue = 7j, k = 2.
- **Guard**: ACWR & CC are masked until **28 days** of history exist since the first session. Until then the dashboard shows "Collecte en cours — encore X jours pour une analyse fiable".

## Acceptance criteria

- [x] Register / login / logout
- [x] Create, edit, delete sessions (with Zod validation front + back)
- [x] `load` computed and stored on create/update
- [x] Dashboard with 4 active metric cards
- [x] ACWR & CC hidden until 28 days of history
- [x] "Charge d'entraînement" chart with CA, CC and optimal band
- [x] Rule-based daily insight
- [x] "Bientôt" sections visible but disabled
- [x] Visual fidelity to the provided mockup
- [x] Strict typing, no unjustified `any`
- [x] 25 unit tests passing on the training-load engine
