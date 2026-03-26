import type { Availability } from "@/types/parking";

type RawEntry = {
  time: number;
  nb_places_libres: number | null;
  nb_parking_libres: number | null;
  nb_pr_libres: number | null;
  nsv_id: number;
};

const API_URL = "https://data.mobilites-m.fr/api/dyn/parking/json";

export async function fetchAvailability(): Promise<Availability> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Availability API error: ${res.status}`);

  const raw: Record<string, RawEntry> = await res.json();

  const data: Availability = {};
  for (const [id, entry] of Object.entries(raw)) {
    data[id] = { free_spaces: entry.nb_places_libres };
  }

  return data;
}
