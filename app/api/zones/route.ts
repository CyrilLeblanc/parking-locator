import { getAllZones } from "@/lib/repositories/zone.repository";

export async function GET() {
  const rows = await getAllZones();

  const featureCollection = {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: JSON.parse(row.geojson),
      properties: {
        name: row.name,
        zone_color: row.zone_color,
        fare_brackets: row.fare_brackets,
      },
    })),
  };

  return Response.json(featureCollection);
}
