import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getEntries } from "@/lib/queries";
import { computeMacrosFromFavorite } from "@/lib/favorites";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  const entries = await getEntries(from, to);
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  let payload: any = {
    date: body.date,
    time: body.time,
    meal_type: body.mealType,
    notes: body.notes ?? "",
  };

  const favoriteId = body.favoriteId ? Number(body.favoriteId) : null;

  if (favoriteId) {
    const { data: favorite, error: favoriteError } = await getDb()
      .from("favorites")
      .select("*")
      .eq("id", favoriteId)
      .single();

    if (favoriteError || !favorite) {
      return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
    }

    const grams = Math.max(Number(body.grams ?? favorite.default_grams ?? 100), 1);
    const macros = computeMacrosFromFavorite(favorite, grams);

    payload = {
      ...payload,
      food_name: String(body.foodName || favorite.label),
      calories: macros.calories,
      protein: macros.protein,
      fat: macros.fat,
      carbs: macros.carbs,
      favorite_id: favoriteId,
      grams,
    };
  } else {
    // Free tracking mode: manual label + macros.
    payload = {
      ...payload,
      food_name: body.foodName,
      calories: Number(body.calories ?? 0),
      protein: Number(body.protein ?? 0),
      fat: Number(body.fat ?? 0),
      carbs: Number(body.carbs ?? 0),
      favorite_id: null,
      grams: body.grams == null ? null : Number(body.grams),
    };
  }

  const { data, error } = await getDb().from("meal_entries").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
