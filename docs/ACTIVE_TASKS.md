# Nutri-MVP Active Tasks

Ordered execution list (strict order: 1 → 2 → 3 → 4).

## Task 1 — Strict shadcn adoption
Status: ✅ Done (implemented)

## Task 2 — Full mobile-first redesign (reference-driven)
Status: 🟡 In progress (initial implementation shipped, awaiting iterative polish against references)

Acceptance focus:
- mobile-first layout quality on iPhone
- bottom nav behavior + safe-area correctness
- visual parity direction with provided references

## Task 3 — New section "Favorites"
Status: ⏳ Pending

Business scope:
- Favorite item fields: name, kcal/protein/fat/carbs per 100g, portion sizes (optional), note (optional)
- API for search/read/create/update favorites for Calzonchik context
- Tracking modes:
  1) track grams from Favorites item
  2) free tracking by label + macros

## Task 4 — Week balance simplification/fix
Status: ⏳ Pending

Scope:
- Week tab shows one primary large counter: selected week balance (current week by default)
- Weekly balance = sum of daily balances for the week
- Keep UI simple and obvious

## Next unfinished task (in order)
1. Task 2 — complete reference-quality mobile-first polish and get user acceptance
2. Task 3 — implement Favorites end-to-end
3. Task 4 — simplify/fix weekly balance view
