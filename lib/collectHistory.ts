import { prisma } from "./prisma";
import { COLLECT_SKIP_THRESHOLD_S, todayDayOfWeek } from "./constants";
import { format } from "date-fns";
import {
  getLastHistoryUpdate,
  upsertParkingHistorySlot,
  upsertParkingDailySlot,
  purgeParkingDailySlots,
} from "./repositories/parking.repository";

const API_URL = "https://data.mobilites-m.fr/api/dyn/parking/json";

type RawEntry = {
  nb_places_libres: number | null;
  nsv_id: number;
};

type ApiResponse = {
  [id: string]: RawEntry;
};

export async function collectHistory(): Promise<void> {
  const now = new Date();

  const lastUpdate = await getLastHistoryUpdate();
  if (lastUpdate !== null) {
    const secondsSinceLast = (now.getTime() - lastUpdate.getTime()) / 1000;
    if (secondsSinceLast < COLLECT_SKIP_THRESHOLD_S) {
      console.log(
        `[collect-history] skipping — last record ${Math.round(secondsSinceLast)}s ago (<4 min)`
      );
      return;
    }
  }

  const day_of_week = todayDayOfWeek(); // Monday = 0
  const slot = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30); // 0–47
  const todayDate = format(now, "yyyy-MM-dd");

  const parkings = await prisma.parking.findMany({
    select: { id: true, total_capacity: true },
  });
  const capacityMap = new Map(parkings.map((p) => [p.id, p.total_capacity]));

  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  const raw: ApiResponse = await res.json();

  let updated = 0;
  let skipped = 0;

  for (const [id, entry] of Object.entries(raw)) {
    const total = capacityMap.get(id);
    if (total === undefined || total === 0) { skipped++; continue; }
    if (entry.nb_places_libres === null) { skipped++; continue; }

    const newValue = Math.max(0, Math.min(100, ((total - entry.nb_places_libres) / total) * 100));
    await upsertParkingHistorySlot(id, day_of_week, slot, newValue);
    await upsertParkingDailySlot(id, todayDate, slot, newValue);
    updated++;
  }

  await purgeParkingDailySlots(todayDate);
  console.log(`[collect-history] ${now.toISOString()} — ${updated} upserted, ${skipped} skipped.`);
}
