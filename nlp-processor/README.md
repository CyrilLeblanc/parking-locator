# nlp-processor

Stateless R microservice exposing a natural-language query engine for parkings,
via a [plumber](https://www.rplumber.io/) HTTP API. It is consumed by the
Next.js app (which acts as a proxy / backend-for-frontend and supplies the
parking data in each request).

The agent logic (`agent.R`) is a faithful port of the original exploratory
script: fuzzy keyword matching (`stringdist`, Jaro-Winkler), negation handling,
multi-criteria filtering, ranking, and gold/silver/bronze medals. Only the I/O
changed — instead of drawing a leaflet map, it returns JSON.

## Endpoints

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /query`

Request body:

```jsonc
{
  "question": "gratuit top 5",
  "parkings": [
    {
      "id": "parking_1",
      "nom": "Parking A",
      "ylat": 45.18,
      "xlong": 5.72,
      "gratuit": true,
      "nb_places": 200,
      "nb_voitures_electriques": 4,
      "nb_velo": 10,
      "nb_pmr": 3,
      "nb_covoit": 0
    }
  ],
  "lat": 45.4,
  "lon": 6.08
}
```

Response body:

```jsonc
{
  "message": "5 résultats trouvés",
  "ranking_criterion": "capacity",
  "intent": { "top_n": 5, "filters": ["gratuit"] },
  "results": [
    { "id": "parking_1", "rank": 1, "medal": "gold",   "distance_km": 1.23 },
    { "id": "parking_2", "rank": 2, "medal": "silver", "distance_km": 1.45 },
    { "id": "parking_3", "rank": 3, "medal": "bronze", "distance_km": 1.60 }
  ]
}
```

- `ranking_criterion`: one of `"capacity" | "ev" | "pmr" | "carpool" | "distance"`, or `null`.
- `medal`: `"gold" | "silver" | "bronze"`, or `null` (only the top 3 of a ranked query get one).
- `distance_km`: `null` unless the query asked for proximity and a user position was provided.

## Run locally

### With Docker (recommended)

From the project root:

```bash
docker compose build nlp
docker compose up nlp
# or, standalone:
docker build -t nlp-processor ./nlp-processor
docker run --rm -p 8000:8000 nlp-processor
```

Then:

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/query \
  -H 'Content-Type: application/json' \
  -d '{"question":"gratuit top 5","parkings":[{"id":"p1","nom":"P1","ylat":45.18,"xlong":5.72,"gratuit":true,"nb_places":200,"nb_voitures_electriques":4,"nb_velo":10,"nb_pmr":3,"nb_covoit":0}],"lat":45.4,"lon":6.08}'
```

### With a local R installation

```bash
Rscript install.R
R -e "plumber::plumb('plumber.R')$run(host='0.0.0.0', port=8000)"
```

The Next.js dev server expects the service at `PLUMBER_BASE_URL`
(default `http://localhost:8000`, see the project `.env.local`).
