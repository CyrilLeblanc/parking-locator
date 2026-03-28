import { getAllParkings } from "@/lib/repositories/parking.repository";

export async function GET() {
  const rows = await getAllParkings();

  const featureCollection = {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: JSON.parse(row.geojson),
      properties: {
        name: row.name,
        address: row.address,
        city: row.city,
        facility_type: row.facility_type,
        free: row.free,
        total_capacity: row.total_capacity,
        estimated_capacity: row.estimated_capacity,
        disabled_spaces: row.disabled_spaces,
        ev_chargers: row.ev_chargers,
        bike_spaces: row.bike_spaces,
        max_height: row.max_height,
        operator: row.operator ?? null,
        source: row.source,
        footprint: row.footprint_geojson ? JSON.parse(row.footprint_geojson) : null,
        fare_1h: row.fare_1h,
        fare_2h: row.fare_2h,
        fare_3h: row.fare_3h,
        fare_4h: row.fare_4h,
        fare_24h: row.fare_24h,
        subscription_resident: row.subscription_resident,
        subscription_non_resident: row.subscription_non_resident,
      },
    })),
  };

  return Response.json(featureCollection);
}
