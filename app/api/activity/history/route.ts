import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const query = getDb().from("daily_activity").select("*").order("created_at", { ascending: false });
  if (from) query.gte("date", from);
  if (to) query.lte("date", to);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(
    (data ?? []).map((item: any) => ({
      id: item.id,
      date: item.date,
      activeCalories: Number(item.active_calories),
      source: item.source,
      createdAt: item.created_at
    }))
  );
}
