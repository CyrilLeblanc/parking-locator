export const revalidate = 60;

type RawEntry = {
  time: number;
  nb_places_libres: number | null;
  nb_parking_libres: number | null;
  nb_pr_libres: number | null;
  nsv_id: number;
};

export async function GET() {
  const res = await fetch(
    "https://data.mobilites-m.fr/api/dyn/parking/json"
  );
  if (!res.ok) {
    return Response.json({}, { status: 502 });
  }

  const raw: Record<string, RawEntry> = await res.json();

  const data: Record<string, { free_spaces: number | null }> = {};
  for (const [id, entry] of Object.entries(raw)) {
    data[id] = { free_spaces: entry.nb_places_libres };
  }

  return Response.json(data);
}
