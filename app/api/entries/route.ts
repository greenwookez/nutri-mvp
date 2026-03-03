import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEntries } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  const entries = await getEntries(from, to);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    date: body.date,
    time: body.time,
    meal_type: body.mealType,
    food_name: body.foodName,
    calories: Number(body.calories ?? 0),
    protein: Number(body.protein ?? 0),
    fat: Number(body.fat ?? 0),
    carbs: Number(body.carbs ?? 0),
    notes: body.notes ?? ""
  };

  const { data, error } = await getDb().from("meal_entries").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
