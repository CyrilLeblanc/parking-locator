import { prisma } from "@/lib/prisma";
import type { ZoneRow } from "@/types/zone";

export async function getAllZones(): Promise<ZoneRow[]> {
  return prisma.$queryRaw<ZoneRow[]>`
    SELECT
      z.id,
      z.name,
      z.zone_color,
      ST_AsGeoJSON(z.geometry) AS geojson,
      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'duration_min', b.duration_min,
              'fare', b.fare,
              'is_penalty', b.is_penalty
            )
            ORDER BY b.duration_min
          )
          FROM street_parking_fare_bracket b
          WHERE b.zone_color = z.zone_color
        ),
        '[]'::json
      ) AS fare_brackets
    FROM street_parking_zone z
  `;
}
