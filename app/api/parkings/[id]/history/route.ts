import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2).toString().padStart(2, "0");
  const m = slot % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
}

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

  const parking = await prisma.parking.findUnique({
    where: { id },
    select: { id: true, name: true, total_capacity: true },
  });
  if (!parking) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await prisma.parkingHistory.findMany({
    where: { parking_id: id, day_of_week: day },
    select: { slot: true, avg_occupancy: true, sample_count: true },
    orderBy: { slot: "asc" },
  });

  const slots = Array.from({ length: 48 }, (_, i) => {
    const row = rows.find((r) => r.slot === i);
    return {
      slot: i,
      time: slotToTime(i),
      avg_occupancy: row ? Math.round(row.avg_occupancy * 10) / 10 : null,
      sample_count: row?.sample_count ?? 0,
    };
  });

  return Response.json({
    parking_id: id,
    parking_name: parking.name,
    total_capacity: parking.total_capacity,
    day_of_week: day,
    slots,
  });
}
