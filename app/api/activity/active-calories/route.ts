import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { activityAuthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!activityAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const payload = {
    date: body.date,
    active_calories: Number(body.activeCalories ?? 0),
    source: body.source ?? "ios-healthkit"
  };

  const { data, error } = await getDb().from("daily_activity").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
