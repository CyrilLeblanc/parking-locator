import { prisma } from "@/lib/prisma";

type ParkingRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  facility_type: string;
  free: boolean;
  total_capacity: number;
  disabled_spaces: number;
  ev_chargers: number;
  bike_spaces: number;
  geojson: string;
  fare_1h: number | null;
  fare_2h: number | null;
  fare_3h: number | null;
  fare_4h: number | null;
  fare_24h: number | null;
  subscription_resident: number | null;
  subscription_non_resident: number | null;
};

export async function GET() {
  const rows = await prisma.$queryRaw<ParkingRow[]>`
    SELECT p.id, p.name, p.address, p.city, p.facility_type, p.free, p.total_capacity,
           p.disabled_spaces, p.ev_chargers, p.bike_spaces,
           ST_AsGeoJSON(p.position) AS geojson,
           f.fare_1h, f.fare_2h, f.fare_3h, f.fare_4h, f.fare_24h,
           f.subscription_resident, f.subscription_non_resident
    FROM parking p
    LEFT JOIN parking_fare f ON f.parking_id = p.id
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
        city: row.city,
        facility_type: row.facility_type,
        free: row.free,
        total_capacity: row.total_capacity,
        disabled_spaces: row.disabled_spaces,
        ev_chargers: row.ev_chargers,
        bike_spaces: row.bike_spaces,
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
