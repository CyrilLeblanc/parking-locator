import { prisma } from "@/lib/prisma";
import type { ParkingRow, HistorySlot } from "@/types/parking";
import { HISTORY_SLOT_COUNT } from "@/lib/constants";

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2).toString().padStart(2, "0");
  const m = slot % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
}

export async function getAllParkings(): Promise<ParkingRow[]> {
  return prisma.$queryRaw<ParkingRow[]>`
    SELECT p.id, p.name, p.address, p.city, p.facility_type, p.free, p.total_capacity,
           p.estimated_capacity, p.disabled_spaces, p.ev_chargers, p.bike_spaces,
           p.moto_spaces, p.moto_ev_spaces, p.carsharing_spaces, p.carpool_spaces,
           p.max_height, p.operator, p.info_url, p.info, p.source,
           ST_AsGeoJSON(COALESCE(ST_Centroid(p.footprint), p.position)) AS geojson,
           ST_AsGeoJSON(p.footprint) AS footprint_geojson,
           f.fare_1h, f.fare_2h, f.fare_3h, f.fare_4h, f.fare_24h,
           f.subscription_resident, f.subscription_non_resident
    FROM parking p
    LEFT JOIN parking_fare f ON f.parking_id = p.id
  `;
}

type ParkingHistoryResult = {
  parking: { id: string; name: string; total_capacity: number } | null;
  slots: HistorySlot[];
};

export async function getParkingHistory(
  id: string,
  day: number
): Promise<ParkingHistoryResult> {
  const parking = await prisma.parking.findUnique({
    where: { id },
    select: { id: true, name: true, total_capacity: true },
  });

  if (!parking) return { parking: null, slots: [] };

  const rows = await prisma.parkingHistory.findMany({
    where: { parking_id: id, day_of_week: day },
    select: { slot: true, avg_occupancy: true, sample_count: true },
    orderBy: { slot: "asc" },
  });

  const slots: HistorySlot[] = Array.from({ length: HISTORY_SLOT_COUNT }, (_, i) => {
    const row = rows.find((r) => r.slot === i);
    return {
      slot: i,
      time: slotToTime(i),
      avg_occupancy: row ? Math.round(row.avg_occupancy * 10) / 10 : null,
      sample_count: row?.sample_count ?? 0,
    };
  });

  return { parking, slots };
}

export async function getLastHistoryUpdate(): Promise<Date | null> {
  const [{ max_updated_at }] = await prisma.$queryRaw<
    [{ max_updated_at: Date | null }]
  >`SELECT MAX(updated_at) AS max_updated_at FROM parking_history`;
  return max_updated_at;
}

export async function upsertParkingHistorySlot(
  id: string,
  day_of_week: number,
  slot: number,
  newValue: number
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO parking_history (parking_id, day_of_week, slot, avg_occupancy, sample_count, updated_at)
    VALUES (${id}, ${day_of_week}, ${slot}, ${newValue}, 1, NOW())
    ON CONFLICT (parking_id, day_of_week, slot) DO UPDATE SET
      avg_occupancy = (parking_history.avg_occupancy * parking_history.sample_count + ${newValue})
                      / (parking_history.sample_count + 1),
      sample_count  = parking_history.sample_count + 1,
      updated_at    = NOW()
  `;
}
