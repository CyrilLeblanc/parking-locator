import { prisma } from "@/lib/prisma";
import type { ParkingRow, HistorySlot, DailySlot } from "@/types/parking";
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
  today_slots: DailySlot[];
};

export async function getParkingHistory(
  id: string,
  day: number,
  todayDate: string
): Promise<ParkingHistoryResult> {
  const parking = await prisma.parking.findUnique({
    where: { id },
    select: { id: true, name: true, total_capacity: true },
  });

  if (!parking) return { parking: null, slots: [], today_slots: [] };

  const [rows, dailyRows] = await Promise.all([
    prisma.parkingHistory.findMany({
      where: { parking_id: id, day_of_week: day },
      select: { slot: true, avg_occupancy: true, sample_count: true },
      orderBy: { slot: "asc" },
    }),
    prisma.parkingDailySlot.findMany({
      where: { parking_id: id, date: todayDate },
      select: { slot: true, occupancy: true },
      orderBy: { slot: "asc" },
    }),
  ]);

  const slots: HistorySlot[] = Array.from({ length: HISTORY_SLOT_COUNT }, (_, i) => {
    const row = rows.find((r) => r.slot === i);
    return {
      slot: i,
      time: slotToTime(i),
      avg_occupancy: row ? Math.round(row.avg_occupancy * 10) / 10 : null,
      sample_count: row?.sample_count ?? 0,
    };
  });

  const today_slots: DailySlot[] = dailyRows.map((r) => ({
    slot: r.slot,
    time: slotToTime(r.slot),
    occupancy: Math.round(r.occupancy * 10) / 10,
  }));

  return { parking, slots, today_slots };
}

export async function getLastHistoryUpdate(): Promise<Date | null> {
  const [{ max_updated_at }] = await prisma.$queryRaw<
    [{ max_updated_at: Date | null }]
  >`SELECT MAX(updated_at) AS max_updated_at FROM parking_history`;
  return max_updated_at;
}

const EMA_ALPHA = 0.05;
const EMA_WARMUP_SAMPLES = 20;

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
      avg_occupancy = CASE
        WHEN parking_history.sample_count < ${EMA_WARMUP_SAMPLES}
          THEN (parking_history.avg_occupancy * parking_history.sample_count + ${newValue})
               / (parking_history.sample_count + 1)
        ELSE ${EMA_ALPHA} * ${newValue} + ${1 - EMA_ALPHA} * parking_history.avg_occupancy
      END,
      sample_count  = parking_history.sample_count + 1,
      updated_at    = NOW()
  `;
}

export async function upsertParkingDailySlot(
  id: string,
  date: string,
  slot: number,
  occupancy: number
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO parking_daily_slot (parking_id, date, slot, occupancy, updated_at)
    VALUES (${id}, ${date}, ${slot}, ${occupancy}, NOW())
    ON CONFLICT (parking_id, date, slot) DO UPDATE SET
      occupancy   = ${occupancy},
      updated_at  = NOW()
  `;
}

export async function purgeParkingDailySlots(beforeDate: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM parking_daily_slot WHERE date < ${beforeDate}
  `;
}
