import { NextRequest } from "next/server";
import { getParkingHistory } from "@/lib/repositories/parking.repository";
import { todayDayOfWeek } from "@/lib/constants";
import { DayParamSchema } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");

  const dayResult = DayParamSchema.safeParse(dayParam ?? String(todayDayOfWeek()));
  if (!dayResult.success) {
    return Response.json({ error: "Invalid day" }, { status: 400 });
  }
  const day = dayResult.data;

  try {
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
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
