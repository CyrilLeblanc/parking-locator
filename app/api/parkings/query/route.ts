import { ParkingQueryRequestSchema } from "@/lib/schemas";
import { searchParkings } from "@/lib/services/parkingQuery.service";

// Proxies a natural-language query to the R/plumber service through the
// parking-query service. POST is never cached, so no `revalidate` export.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ParkingQueryRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await searchParkings(parsed.data);
    return Response.json(result);
  } catch {
    return Response.json({ error: "Service unavailable" }, { status: 502 });
  }
}
