# Parking Locator Grenoble

An open source interactive map to help you find and choose a parking spot in Grenoble, France. It shows real-time occupancy for covered car parks and tariff zones for street parking.

![Map view with parking markers and zone overlays](public/screenshot.png)

## Features

- **Interactive map** centered on Grenoble, with marker clustering
- **42 covered car parks** from the Grenoble-Alpes Métropole (LaMetro) open data
  - Real-time free spaces (updated every 60 s)
  - Capacity, disabled spaces, EV chargers, bike spaces, max vehicle height
  - Fare details (hourly, daily, resident / non-resident subscriptions)
  - Dynamic pie-chart icons that show occupancy at a glance
- **Street parking zones** (vert / orange / violet) with polygon overlays
  - Current tariff status (free / paid / half-fare) based on the time of day
  - Next tariff-change countdown
- **Occupancy history** — 30-minute-slot rolling averages per car park
  - Line chart (Recharts) with day-of-week selector
  - Automatically collected every 5 minutes in the background

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + React 19 |
| Map | Leaflet + react-leaflet + react-leaflet-cluster |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 17 + PostGIS 3.5 |
| Runtime | Node.js 24 |

## Data sources

| Data | Provider | Refresh |
|---|---|---|
| Car park locations & metadata | [LaMetro open data](https://data.mobilites-m.fr) | Manual import |
| Real-time availability | LaMetro dynamic API | 60 s |
| Parking fares | LaMetro norms API | Manual import |
| Street parking zones | [Grenoble open data](https://data.metropolegrenoble.fr) | Manual import |

## Getting started

### Prerequisites

- Node.js 24 (`nvm use`)
- Docker & Docker Compose

### 1 — Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 17 + PostGIS 3.5 container on port 5432.

### 2 — Configure environment

```bash
cp .env.example .env.local
# edit .env.local if needed — the default works with docker compose
```

`.env.local`:
```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/parking_locator"
```

### 3 — Install dependencies and run migrations

```bash
npm install
npx prisma migrate deploy
```

### 4 — Import data

```bash
npm run import   # zones → parkings → fares (in order)
```

### 5 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Occupancy history is collected automatically every 5 minutes once the server is running (via `instrumentation.ts`). You can also trigger a single collection manually:

```bash
npm run collect:history
```

## Production deployment (Docker)

The app ships with a multi-stage `Dockerfile` and a `docker-compose.prod.yaml` that runs both the app and the database.

### Build and start

```bash
POSTGRES_PASSWORD=changeme docker compose -f docker-compose.prod.yaml up -d --build
```

- Migrations run automatically on each container start (`prisma migrate deploy`).
- The app is available on port **3000**.
- The database is not exposed to the host — only the app can reach it through the internal Docker network.

### First-time data import

Run the import scripts once after the first deployment:

```bash
POSTGRES_PASSWORD=changeme docker compose -f docker-compose.prod.yaml --profile tools run --rm importer
```

> The `POSTGRES_PASSWORD` variable is the only required secret. Set it in a `.env.prod` file or export it in your shell before running `docker compose`.

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run import` | Import all data (zones → parkings → fares) |
| `npm run import:zones` | Import street parking zones |
| `npm run import:parkings` | Import car park locations |
| `npm run import:fares` | Import car park tariffs |
| `npm run collect:history` | Collect one occupancy snapshot |

## Project structure

```
app/
  api/
    parkings/         # GET /api/parkings — GeoJSON car parks
    parkings/[id]/
      history/        # GET /api/parkings/[id]/history — occupancy by day
    zones/            # GET /api/zones — GeoJSON street zones
    availability/     # GET /api/availability — real-time free spaces
  page.tsx            # Entry point (MapWrapper)
components/
  Map.tsx             # Main Leaflet map + layers
  ParkingsLayer.tsx   # Car park markers + clustering
  ZonesLayer.tsx      # Street zone polygons
  ParkingBottomSheet.tsx  # Car park detail panel + history chart
  ZoneBottomSheet.tsx     # Zone tariff panel
lib/
  collectHistory.ts   # Background history collection logic
  zoneConfig.ts       # Zone tariff schedules & helpers
prisma/
  schema.prisma       # Database schema
  migrations/         # SQL migrations
scripts/
  import-parkings.ts
  import-fares.ts
  import-zones.ts
  collect-history.ts
instrumentation.ts    # Starts background history collector
```

## License

MIT
