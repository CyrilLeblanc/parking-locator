import { prisma } from "@/lib/prisma";

type ZoneRow = {
  id: string;
  name: string;
  zone_color: string;
  hourly_fare: number;
  geojson: string;
};

export async function GET() {
  const rows = await prisma.$queryRaw<ZoneRow[]>`
    SELECT id, name, zone_color, hourly_fare, ST_AsGeoJSON(geometry) AS geojson
    FROM street_parking_zone
  `;

  const featureCollection = {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: JSON.parse(row.geojson),
      properties: {
        name: row.name,
        zone_color: row.zone_color,
        hourly_fare: row.hourly_fare,
      },
    })),
  };

  return Response.json(featureCollection);
}
