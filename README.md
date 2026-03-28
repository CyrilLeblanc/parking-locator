# Parking Locator Grenoble

An open-source interactive map to find and compare parking in Grenoble, France — covered car parks with real-time occupancy and street parking zones with live tariff status.

![Map view with parking markers and zone overlays](public/screenshot.png)

## Features

### Covered car parks
- **42 car parks** from the Grenoble-Alpes Métropole (LaMetro) open data
- **Real-time free spaces** refreshed every 60 s, shown as a badge on each marker
- **OSM parking footprints** — polygon overlays from OpenStreetMap shown directly on the map with estimated capacity
- **Filters** — PMR (disabled), EV chargers, subscriptions, vehicle height (gabarit), free parking
- **Price estimation** — enter your planned duration to see the estimated cost for each car park
- **Occupancy history** — 30-minute slot averages (EMA-weighted, recent data prioritised) per car park, per day of week; today's actual progression overlaid on the historical trend
- **Full detail panel** — capacity, disabled spaces, EV chargers, bike spaces, max height, fare schedule
- **Directions** — one-tap link to Google Maps navigation

### Street parking zones
- Polygon overlays for the three tariff zones (vert / orange / violet)
- Live tariff status (free / paid / half-fare) based on the current time
- Countdown to the next tariff change

### Map
- Marker clustering for a clean view at any zoom level
- Pie-chart icons on car park markers to show occupancy at a glance
- Viewport position (zoom/lat/lng) persisted in the URL hash

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + React 19 |
| Map | Leaflet + react-leaflet + react-leaflet-cluster |
| Charts | Recharts |
| Data fetching | TanStack Query (react-query) |
| Validation | Zod |
| URL state | nuqs |
| Date utilities | date-fns |
| Styling | Tailwind CSS 4 |
| Language | TypeScript 5 |
| ORM | Prisma 7 with `@prisma/adapter-pg` |
| Database | PostgreSQL 17 + PostGIS 3.5 |
| Runtime | Node.js 24 |

## Data sources

| Data | Provider | Refresh |
|---|---|---|
| Car park locations & metadata | [LaMetro open data](https://data.mobilites-m.fr) | Weekly (Sun 4 am) |
| Real-time availability | LaMetro dynamic API | Every 60 s |
| Parking fares | LaMetro norms API | Weekly (Sun 4 am) |
| Street parking zones | [Grenoble open data](https://data.metropolegrenoble.fr) | Weekly (Sun 4 am) |
| Parking footprints | OpenStreetMap (Overpass API) | Daily (3 am) |
| Occupancy history | LaMetro dynamic API | Every 5 min |

## Getting started

### Prerequisites

- Node.js 24 (`nvm use`)
- Docker & Docker Compose

### 1 — Start the database

```bash
docker compose up -d
```

Starts a PostgreSQL 17 + PostGIS 3.5 container on port 5432.

### 2 — Configure environment

```bash
cp .env.example .env.local
# default values work out of the box with docker compose
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
npm run import              # zones → parkings → fares (core data)
npm run import:zone-fare-brackets   # street zone tariff rules
npm run import:osm-parkings         # enrich with OpenStreetMap footprints
```

### 5 — Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The server runs three background jobs automatically via `instrumentation.ts`:

| Job | Schedule |
|---|---|
| Occupancy history collection | Every 5 min |
| OSM parking footprint update | Daily at 3 am |
| Full data import (parkings, fares, zones) | Sundays at 4 am |

To trigger a single history collection manually:

```bash
npm run collect:history
```

## Production deployment (Docker)

The project ships with a multi-stage `Dockerfile` and a `docker-compose.prod.yaml` that runs both the app and the database.

### Build and start

```bash
POSTGRES_PASSWORD=changeme docker compose -f docker-compose.prod.yaml up -d --build
```

- Migrations run automatically on every container start.
- The app listens on port **3000**.
- The database is not exposed to the host — only the app container can reach it.

### First-time data import

Run the import scripts once after the first deployment:

```bash
POSTGRES_PASSWORD=changeme docker compose -f docker-compose.prod.yaml --profile tools run --rm importer
```

> `POSTGRES_PASSWORD` is the only required secret. Put it in a `.env.prod` file or export it in your shell before running `docker compose`.

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run import` | Import core data (zones → parkings → fares) |
| `npm run import:zones` | Import street parking zones |
| `npm run import:parkings` | Import car park locations & metadata |
| `npm run import:fares` | Import car park tariffs |
| `npm run import:zone-fare-brackets` | Import street zone tariff rules |
| `npm run import:osm-parkings` | Import & merge OpenStreetMap parking data |
| `npm run collect:history` | Collect one occupancy snapshot |

## Project structure

```
app/
  api/
    parkings/           # GET /api/parkings — GeoJSON car parks
    parkings/[id]/
      history/          # GET /api/parkings/[id]/history — occupancy by day
    zones/              # GET /api/zones — GeoJSON street zones
    availability/       # GET /api/availability — real-time free spaces
  page.tsx              # Entry point (MapWrapper)
components/
  map/
    filters/
      DurationFilter.tsx    # Duration picker for fare estimation
      ParkingFilters.tsx    # Filter toggles (PMR, EV, subscription, height, free)
    FilterBar.tsx           # Filter/duration bar wrapper
    Map.tsx                 # Leaflet map core
    MapWrapper.tsx          # Map initialisation
  parking/
    ParkingBottomSheet.tsx  # Car park detail panel + history chart
    ParkingFootprintLayer.tsx  # OSM footprint polygon overlay
    ParkingPinIcon.tsx      # Pie-chart marker icons
    ParkingsLayer.tsx       # Markers + clustering
  zone/
    ZoneBottomSheet.tsx     # Zone tariff panel
    ZoneLegend.tsx          # Zone colour legend
    ZonesLayer.tsx          # Zone polygon overlay
  NavigateButton.tsx        # Google Maps directions link
hooks/
  use-parkings.ts           # Car park data fetching
  use-parking-history.ts    # History data fetching
  use-zones.ts              # Zone data fetching
  use-is-mobile.ts
lib/
  collectHistory.ts         # Background history collection logic
  constants.ts              # Map config, intervals, history slots
  fareEstimation.ts         # Price estimation for car parks and zones
  parkingConfig.ts          # Facility type labels
  parkingFilters.ts         # Filter matching logic
  zoneConfig.ts             # Zone tariff schedules & helpers
  repositories/             # Database query layer
  services/                 # External API clients
prisma/
  schema.prisma             # Database schema
  migrations/               # SQL migrations
scripts/
  import-parkings.ts
  import-fares.ts
  import-zones.ts
  import-zone-fare-brackets.ts
  import-osm-parkings.ts
  collect-history.ts
instrumentation.ts          # Starts background history collector
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, conventions, and guidelines.

## License

MIT
