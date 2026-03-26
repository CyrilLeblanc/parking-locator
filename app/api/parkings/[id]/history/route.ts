import { NextRequest } from "next/server";
import { getParkingHistory } from "@/lib/repositories/parking.repository";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");
  const today = (new Date().getDay() + 6) % 7;
  const day = dayParam !== null ? parseInt(dayParam, 10) : today;

  if (isNaN(day) || day < 0 || day > 6) {
    return Response.json({ error: "Invalid day" }, { status: 400 });
  }

  const { parking, slots } = await getParkingHistory(id, day);
  if (!parking) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({
    parking_id: id,
    parking_name: parking.name,
    total_capacity: parking.total_capacity,
    day_of_week: day,
    slots,
  });
}
