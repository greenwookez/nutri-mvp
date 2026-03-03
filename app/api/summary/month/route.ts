import { NextRequest, NextResponse } from "next/server";
import { daySummary } from "@/lib/queries";
import { monthRange, toISODate } from "@/lib/date";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? toISODate(new Date());
  const { from, to } = monthRange(date);
  const days: any[] = [];
  let cursor = new Date(from);
  const end = new Date(to);
  while (cursor <= end) {
    const day = toISODate(cursor);
    days.push(await daySummary(day));
    cursor.setDate(cursor.getDate() + 1);
  }
  return NextResponse.json({ date, from, to, days });
}
