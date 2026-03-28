import { fetchAvailability } from "@/lib/services/availability.service";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await fetchAvailability();
    return Response.json(data);
  } catch {
    return Response.json({ error: "Service unavailable" }, { status: 502 });
  }
}
