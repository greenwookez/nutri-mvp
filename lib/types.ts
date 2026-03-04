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
  favoriteId?: number | null;
  grams?: number | null;
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

export type FavoritePortion = {
  id?: number;
  label: string;
  grams: number;
  sortOrder?: number;
};

export type FavoriteItem = {
  id: number;
  label: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  defaultGrams: number;
  notes: string;
  portions: FavoritePortion[];
  createdAt: string;
  updatedAt: string;
};
