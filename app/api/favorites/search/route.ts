import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { mapFavorite } from "@/lib/favorites";
import { FavoriteItem, FavoritePortion } from "@/lib/types";

// Lightweight search endpoint for Calzonchik context retrieval.
export async function GET(req: NextRequest) {
  const q = String(req.nextUrl.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 10), 25);

  let query = getDb()
    .from("favorites")
    .select("*, favorite_portions(*)")
    .order("updated_at", { ascending: false })
    .order("sort_order", { ascending: true, referencedTable: "favorite_portions" })
    .limit(limit);

  if (q) {
    query = query.ilike("label", `%${q}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const items = (data ?? []).map(mapFavorite).map((item: FavoriteItem) => ({
    ...item,
    retrievalText: `${item.label}; per100: kcal ${item.caloriesPer100g}, P ${item.proteinPer100g}, F ${item.fatPer100g}, C ${item.carbsPer100g}; portions: ${item.portions
      .map((p: FavoritePortion) => `${p.label}=${p.grams}g`)
      .join(", ")}`,
  }));

  return NextResponse.json({ query: q, items });
}
