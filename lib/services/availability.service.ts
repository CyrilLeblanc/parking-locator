import type { Availability } from "@/types/parking";
import { RawAvailabilityResponseSchema } from "@/lib/schemas";

const API_URL = "https://data.mobilites-m.fr/api/dyn/parking/json";

export async function fetchAvailability(): Promise<Availability> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Availability API error: ${res.status}`);

  const raw = RawAvailabilityResponseSchema.parse(await res.json());

  const data: Availability = {};
  for (const [id, entry] of Object.entries(raw)) {
    data[id] = { free_spaces: entry.nb_places_libres };
  }

  return data;
}
