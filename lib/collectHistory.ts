import { prisma } from "./prisma";

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

  const [{ max_updated_at }] = await prisma.$queryRaw<
    [{ max_updated_at: Date | null }]
  >`SELECT MAX(updated_at) AS max_updated_at FROM parking_history`;

  if (max_updated_at !== null) {
    const secondsSinceLast = (now.getTime() - max_updated_at.getTime()) / 1000;
    if (secondsSinceLast < 4 * 60) {
      console.log(
        `[collect-history] skipping — last record ${Math.round(secondsSinceLast)}s ago (<4 min)`
      );
      return;
    }
  }

  const day_of_week = (now.getDay() + 6) % 7; // Monday = 0
  const slot = Math.floor((now.getHours() * 60 + now.getMinutes()) / 30); // 0–47

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

    await prisma.$executeRaw`
      INSERT INTO parking_history (parking_id, day_of_week, slot, avg_occupancy, sample_count, updated_at)
      VALUES (${id}, ${day_of_week}, ${slot}, ${newValue}, 1, NOW())
      ON CONFLICT (parking_id, day_of_week, slot) DO UPDATE SET
        avg_occupancy = (parking_history.avg_occupancy * parking_history.sample_count + ${newValue})
                        / (parking_history.sample_count + 1),
        sample_count  = parking_history.sample_count + 1,
        updated_at    = NOW()
    `;
    updated++;
  }

  console.log(`[collect-history] ${now.toISOString()} — ${updated} upserted, ${skipped} skipped.`);
}
