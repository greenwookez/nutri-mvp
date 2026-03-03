import { MealEntry } from "@/lib/types";

export function sumMeals(entries: MealEntry[]) {
  return entries.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      carbs: acc.carbs + item.carbs,
      meals: acc.meals + 1
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, meals: 0 }
  );
}

export function remainingBudget(targetCalories: number, activeCalories: number, consumedCalories: number) {
  return targetCalories + activeCalories - consumedCalories;
}
