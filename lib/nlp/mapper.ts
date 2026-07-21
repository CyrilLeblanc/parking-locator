import type { ParkingRow } from "@/types/parking";
import type { PlumberResponse } from "@/lib/schemas";
import type { PlumberRow, ParkingSearchResult, RankedParking } from "./types";

type LatLng = { lat: number; lng: number };

// Parses the GeoJSON Point string produced by the repository (ST_AsGeoJSON)
// into {lat, lng}. Returns null if not a valid point.
function extractPoint(geojson: string): LatLng | null {
  try {
    const geom = JSON.parse(geojson) as { type?: string; coordinates?: unknown };
    if (geom.type !== "Point" || !Array.isArray(geom.coordinates)) return null;
    const [lng, lat] = geom.coordinates as [number, number];
    if (typeof lng !== "number" || typeof lat !== "number") return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Maps a domain ParkingRow to the DTO expected by the R service. Returns null
// when the parking has no usable point geometry (filtered out by the caller).
export function parkingRowToPlumberRow(row: ParkingRow): PlumberRow | null {
  const point = extractPoint(row.geojson);
  if (!point) return null;

  return {
    id: row.id,
    nom: row.name,
    ylat: point.lat,
    xlong: point.lng,
    gratuit: row.free,
    nb_places: row.total_capacity,
    nb_voitures_electriques: row.ev_chargers,
    nb_velo: row.bike_spaces,
    nb_pmr: row.disabled_spaces,
    nb_covoit: row.carpool_spaces,
  };
}

// Maps the validated R response DTO to the domain result. Nullish wire values
// are coerced to null so the domain never carries `undefined`.
export function toSearchResult(res: PlumberResponse): ParkingSearchResult {
  const results: RankedParking[] = res.results.map((r) => ({
    id: r.id,
    rank: r.rank,
    medal: r.medal ?? null,
    distanceKm: r.distance_km ?? null,
  }));

  return {
    message: res.message,
    rankingCriterion: res.ranking_criterion ?? null,
    intent: {
      topN: res.intent.top_n ?? null,
      filters: res.intent.filters,
    },
    results,
  };
}
