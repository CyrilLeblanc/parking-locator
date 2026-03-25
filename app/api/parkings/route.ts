import { prisma } from "@/lib/prisma";

type ParkingRow = {
  id: string;
  name: string;
  address: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  geojson: string;
};

export async function GET() {
  const rows = await prisma.$queryRaw<ParkingRow[]>`
    SELECT id, name, address, facility_type, free, total_capacity,
           disabled_spaces, ev_chargers, bike_spaces,
           ST_AsGeoJSON(position) AS geojson
    FROM parking
  `;

  const featureCollection = {
    type: "FeatureCollection",
    features: rows.map((row) => ({
      type: "Feature",
      id: row.id,
      geometry: JSON.parse(row.geojson),
      properties: {
        name: row.name,
        address: row.address,
        facility_type: row.facility_type,
        free: row.free,
        total_capacity: row.total_capacity,
        disabled_spaces: row.disabled_spaces,
        ev_chargers: row.ev_chargers,
        bike_spaces: row.bike_spaces,
      },
    })),
  };

  return Response.json(featureCollection);
}
