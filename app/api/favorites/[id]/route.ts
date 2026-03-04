import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mapFavorite, sanitizePortions, toNumber } from "@/lib/favorites";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await getDb()
    .from("favorites")
    .select("*, favorite_portions(*)")
    .eq("id", Number(id))
    .single();

  if (error) {
    const status = error.code === "PGRST116" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? "Not found" : error.message }, { status });
  }

  return NextResponse.json(mapFavorite(data));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const favoriteId = Number(id);
  const body = await req.json();

  const payload = {
    label: String(body.label ?? body.name ?? "").trim(),
    calories_per_100g: toNumber(body.caloriesPer100g ?? body.kcalPer100, 0),
    protein_per_100g: toNumber(body.proteinPer100g ?? body.proteinPer100, 0),
    fat_per_100g: toNumber(body.fatPer100g ?? body.fatPer100, 0),
    carbs_per_100g: toNumber(body.carbsPer100g ?? body.carbsPer100, 0),
    default_grams: toNumber(body.defaultGrams ?? 100, 100),
    notes: String(body.notes ?? body.note ?? ""),
    updated_at: new Date().toISOString(),
  };

  if (!payload.label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const { error } = await getDb().from("favorites").update(payload).eq("id", favoriteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: cleanError } = await getDb().from("favorite_portions").delete().eq("favorite_id", favoriteId);
  if (cleanError) return NextResponse.json({ error: cleanError.message }, { status: 500 });

  const portions = sanitizePortions(body.portions);
  if (portions.length > 0) {
    const { error: insertError } = await getDb().from("favorite_portions").insert(
      portions.map((portion) => ({
        favorite_id: favoriteId,
        label: portion.label,
        grams: portion.grams,
        sort_order: portion.sort_order,
      }))
    );

    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: hydrated, error: hydratedError } = await getDb()
    .from("favorites")
    .select("*, favorite_portions(*)")
    .eq("id", favoriteId)
    .single();

  if (hydratedError) return NextResponse.json({ error: hydratedError.message }, { status: 500 });

  return NextResponse.json(mapFavorite(hydrated));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const favoriteId = Number(id);

  const { error } = await getDb().from("favorites").delete().eq("id", favoriteId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
