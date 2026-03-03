export type MealEntry = {
  id: number;
  date: string;
  time: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  notes: string;
  createdAt: string;
};

export type DaySummary = {
  date: string;
  totals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    meals: number;
  };
  targetCalories: number;
  activeCalories: number;
  netCalories: number;
  deltaCalories: number;
};
