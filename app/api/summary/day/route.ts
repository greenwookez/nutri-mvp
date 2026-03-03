import { NextRequest, NextResponse } from "next/server";
import { daySummary } from "@/lib/queries";
import { toISODate } from "@/lib/date";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") ?? toISODate(new Date());
  const summary = await daySummary(date);
  return NextResponse.json(summary);
}
