import { FavoriteItem } from "@/lib/types";

export function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function sanitizePortions(input: any[] | undefined) {
  return (input ?? [])
    .map((item, index) => ({
      label: String(item?.label ?? "").trim(),
      grams: toNumber(item?.grams, 0),
      sort_order: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index,
    }))
    .filter((item) => item.label.length > 0 && item.grams > 0);
}

export function computeMacrosFromFavorite(favorite: {
  calories_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
}, grams: number) {
  const ratio = grams / 100;
  return {
    calories: Number((Number(favorite.calories_per_100g) * ratio).toFixed(2)),
    protein: Number((Number(favorite.protein_per_100g) * ratio).toFixed(2)),
    fat: Number((Number(favorite.fat_per_100g) * ratio).toFixed(2)),
    carbs: Number((Number(favorite.carbs_per_100g) * ratio).toFixed(2)),
  };
}

export function mapFavorite(row: any): FavoriteItem {
  return {
    id: row.id,
    label: row.label,
    caloriesPer100g: Number(row.calories_per_100g),
    proteinPer100g: Number(row.protein_per_100g),
    fatPer100g: Number(row.fat_per_100g),
    carbsPer100g: Number(row.carbs_per_100g),
    defaultGrams: Number(row.default_grams),
    notes: row.notes ?? "",
    portions: (row.favorite_portions ?? []).map((portion: any) => ({
      id: portion.id,
      label: portion.label,
      grams: Number(portion.grams),
      sortOrder: portion.sort_order,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
