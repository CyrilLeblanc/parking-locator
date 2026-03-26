import { prisma } from "@/lib/prisma";
import type { ZoneRow } from "@/types/zone";

export async function getAllZones(): Promise<ZoneRow[]> {
  return prisma.$queryRaw<ZoneRow[]>`
    SELECT id, name, zone_color, hourly_fare, ST_AsGeoJSON(geometry) AS geojson
    FROM street_parking_zone
  `;
}
