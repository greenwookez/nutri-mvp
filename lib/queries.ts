import { getDb } from "@/lib/db";
import { remainingBudget, sumMeals } from "@/lib/calculations";
import { MealEntry } from "@/lib/types";

const DEFAULT_TARGET = 2200;

function mapEntry(row: any): MealEntry {
  return {
    id: row.id,
    date: row.date,
    time: row.time,
    mealType: row.meal_type,
    foodName: row.food_name,
    calories: Number(row.calories),
    protein: Number(row.protein),
    fat: Number(row.fat),
    carbs: Number(row.carbs),
    notes: row.notes ?? "",
    createdAt: row.created_at
  };
}

export async function getEntries(from: string, to: string) {
  const { data, error } = await getDb()
    .from("meal_entries")
    .select("*")
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: false })
    .order("time", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

export async function getLatestActivity(date: string) {
  const { data, error } = await getDb()
    .from("daily_activity")
    .select("*")
    .eq("date", date)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function daySummary(date: string) {
  const entries = await getEntries(date, date);
  const totals = sumMeals(entries);

  const { data: goal } = await getDb()
    .from("daily_goals")
    .select("target_calories")
    .eq("date", date)
    .maybeSingle();

  const targetCalories = Number(goal?.target_calories ?? DEFAULT_TARGET);
  const latestActivity = await getLatestActivity(date);
  const activeCalories = Number(latestActivity?.active_calories ?? 0);
  const netCalories = totals.calories - activeCalories;

  return {
    date,
    totals,
    targetCalories,
    activeCalories,
    netCalories,
    deltaCalories: remainingBudget(targetCalories, activeCalories, totals.calories)
  };
}
