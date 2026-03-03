import { NextRequest, NextResponse } from "next/server";
import { getLatestActivity } from "@/lib/queries";
import { toISODate } from "@/lib/date";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? toISODate(new Date());
  const item = await getLatestActivity(date);
  return NextResponse.json(
    item
      ? {
          id: item.id,
          date: item.date,
          activeCalories: Number(item.active_calories),
          source: item.source,
          createdAt: item.created_at,
          updatedAt: item.created_at
        }
      : null
  );
}
