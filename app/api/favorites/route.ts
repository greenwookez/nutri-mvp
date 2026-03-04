import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mapFavorite, sanitizePortions, toNumber } from "@/lib/favorites";

export async function GET() {
  const { data, error } = await getDb()
    .from("favorites")
    .select("*, favorite_portions(*)")
    .order("label", { ascending: true })
    .order("sort_order", { ascending: true, referencedTable: "favorite_portions" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(mapFavorite));
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    label: String(body.label ?? body.name ?? "").trim(),
    calories_per_100g: toNumber(body.caloriesPer100g ?? body.kcalPer100, 0),
    protein_per_100g: toNumber(body.proteinPer100g ?? body.proteinPer100, 0),
    fat_per_100g: toNumber(body.fatPer100g ?? body.fatPer100, 0),
    carbs_per_100g: toNumber(body.carbsPer100g ?? body.carbsPer100, 0),
    default_grams: toNumber(body.defaultGrams ?? 100, 100),
    notes: String(body.notes ?? body.note ?? ""),
  };

  if (!payload.label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const { data: favorite, error } = await getDb().from("favorites").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const portions = sanitizePortions(body.portions);
  if (portions.length > 0) {
    const { error: portionsError } = await getDb().from("favorite_portions").insert(
      portions.map((portion) => ({
        favorite_id: favorite.id,
        label: portion.label,
        grams: portion.grams,
        sort_order: portion.sort_order,
      }))
    );

    if (portionsError) return NextResponse.json({ error: portionsError.message }, { status: 500 });
  }

  const { data: hydrated, error: hydratedError } = await getDb()
    .from("favorites")
    .select("*, favorite_portions(*)")
    .eq("id", favorite.id)
    .single();

  if (hydratedError) return NextResponse.json({ error: hydratedError.message }, { status: 500 });

  return NextResponse.json(mapFavorite(hydrated), { status: 201 });
}
