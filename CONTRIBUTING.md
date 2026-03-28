# Contributing to parking-locator

## Prerequisites

- Node.js 24 (`nvm use`)
- PostgreSQL with the **PostGIS** extension enabled (or use `docker compose up -d`)
- `tsx` (installed via `npm install`)

## Setup

```bash
cp .env.example .env.local
# default values work with docker compose; edit DATABASE_URL otherwise
npm install
npx prisma migrate deploy
```

## Running locally

```bash
npm run dev        # start dev server
npm run lint       # run ESLint
npm run build      # type-check + production build
```

## Data flow

```
External APIs / CSV files
        ↓
scripts/import-*.ts   (one-shot, destructive — see below)
        ↓
PostgreSQL + PostGIS
        ↓
app/api/*/route.ts    (Next.js API routes, return GeoJSON)
        ↓
hooks/use-*.ts        (client-side data fetching + state)
        ↓
components/*Layer.tsx (Leaflet map layers)
        ↓
Leaflet map
```

History collection runs **continuously** on the server: `instrumentation.ts` starts a
`setInterval` (every 5 min) when Next.js boots. Data accumulates over days — the UI shows
a "low confidence" warning when fewer than 20 samples exist for a slot.

## Importing data

> **Warning — import scripts are destructive.** Each script runs `TRUNCATE TABLE … CASCADE`
> before inserting. Never run against a production database without a backup.

```bash
npm run import           # zones + parkings (LaMetro) + fares, in order
npm run import:osm-parkings  # OpenStreetMap parkings (merged with LaMetro data)
npm run import:zone-fare-brackets  # voirie fare brackets
```

Scripts are idempotent: re-running them produces the same result.

## Key conventions

### Day-of-week encoding

This codebase uses **Monday = 0, Sunday = 6** — not JavaScript's default (Sunday = 0).
Always use `todayDayOfWeek()` from `lib/constants.ts` instead of calling `new Date().getDay()`
directly. Never hardcode the `(getDay() + 6) % 7` formula — it already lives in that helper.

### Why raw SQL?

PostGIS geometry functions (`ST_AsGeoJSON`, `ST_DWithin`, `ST_SetSRID`, …) are not
available through the Prisma Client API. All geo queries use `prisma.$queryRaw` /
`prisma.$executeRaw` with Prisma's template-literal escaping (safe against injection).
Regular non-geo queries should prefer the Prisma Client API.

### Formatting currency

Use `formatFareValue(value)` from `lib/fareEstimation.ts` everywhere. It handles:
- `0` → `"Gratuit"`
- integers → `"2 €"` (no decimals)
- decimals → `"1,50 €"` (French comma separator)

Never define a local formatting function for fares.

### Error state in hooks

All data-fetching hooks (`useParkings`, `useZones`, `useParkingHistory`) expose an
`error: boolean` field alongside `loading`. Callers that want to surface errors to the user
should destructure it. Callers that don't need it can ignore it — the map degrades
gracefully on failure.

## Next.js version

This project uses a version of Next.js with **breaking changes** from earlier releases.
Before writing any framework-level code (layouts, routing, server components, API routes),
read the relevant guide in `node_modules/next/dist/docs/`. Do not rely on training data
or external tutorials for API shapes — verify against the local docs.

## Submitting a pull request

1. Open an issue first to discuss the bug or feature.
2. Keep PRs focused — one concern per PR.
3. Run `npm run lint` and `npm run build` before pushing; both must pass.
4. Describe *why* the change is needed in the PR body, not just what changed.
