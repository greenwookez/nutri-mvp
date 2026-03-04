# Nutri MVP API (updated)

## Entries

### GET /api/entries?from=YYYY-MM-DD&to=YYYY-MM-DD
Returns meal entries for range.

### POST /api/entries
Two modes:

1. **Free tracking mode**
```json
{
  "date": "2026-03-04",
  "time": "12:30",
  "mealType": "Lunch",
  "foodName": "Protein shake",
  "calories": 280,
  "protein": 30,
  "fat": 6,
  "carbs": 24,
  "notes": "manual"
}
```

2. **Favorite mode (grams-based)**
```json
{
  "date": "2026-03-04",
  "time": "08:45",
  "mealType": "Breakfast",
  "favoriteId": 12,
  "grams": 180,
  "notes": "from favorites"
}
```
Server computes macros from favorite `*_per_100g` and stores `favorite_id` + `grams` in `meal_entries`.

### DELETE /api/entries/:id
Deletes one meal entry.

## Favorites

### GET /api/favorites?q=<optional>&limit=<optional>
List/search favorites with nested portions.

### POST /api/favorites
Create favorite:
```json
{
  "label": "Greek yogurt",
  "caloriesPer100g": 62,
  "proteinPer100g": 10,
  "fatPer100g": 0.5,
  "carbsPer100g": 4,
  "defaultGrams": 170,
  "notes": "2%",
  "portions": [
    { "label": "cup", "grams": 170, "sortOrder": 0 }
  ]
}
```

### GET /api/favorites/:id
Get single favorite.

### PUT /api/favorites/:id
Update favorite and replace portions.

### DELETE /api/favorites/:id
Delete favorite (linked `meal_entries.favorite_id` becomes `null`).

### GET /api/favorites/search?q=<optional>&limit=<optional>
Retrieval-friendly response for Calzonchik context (`retrievalText` field included).
