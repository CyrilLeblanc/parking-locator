import type { Feature, Point } from "geojson";
import type { ParkingFeatureProperties, SelectedParking } from "@/types/parking";

// Builds a SelectedParking from a GeoJSON parking feature plus its current
// availability. Centralizes the property flattening so the marker click, the
// URL-restore path, and the natural-language search results all select a
// parking the same way (no ad-hoc conversion scattered across components).
export function featureToSelectedParking(
  feature: Feature,
  freeSpaces: number | null
): SelectedParking {
  const p = feature.properties as ParkingFeatureProperties;
  const [lng, lat] = (feature.geometry as Point).coordinates;

  return {
    id: feature.id as string,
    lat,
    lng,
    name: p.name,
    address: p.address,
    city: p.city,
    facility_type: p.facility_type,
    free: p.free,
    total_capacity: p.total_capacity,
    estimated_capacity: p.estimated_capacity ?? null,
    disabled_spaces: p.disabled_spaces,
    ev_chargers: p.ev_chargers,
    bike_spaces: p.bike_spaces,
    moto_spaces: p.moto_spaces,
    moto_ev_spaces: p.moto_ev_spaces,
    carsharing_spaces: p.carsharing_spaces,
    carpool_spaces: p.carpool_spaces,
    relais_spaces: p.relais_spaces ?? 0,
    max_height: p.max_height ?? null,
    operator: p.operator ?? null,
    info_url: p.info_url ?? null,
    info: p.info ?? null,
    source: p.source,
    footprint: p.footprint ?? null,
    fare_1h: p.fare_1h,
    fare_2h: p.fare_2h,
    fare_3h: p.fare_3h,
    fare_4h: p.fare_4h,
    fare_24h: p.fare_24h,
    subscription_resident: p.subscription_resident,
    subscription_non_resident: p.subscription_non_resident,
    free_spaces: freeSpaces,
  };
}
