# Task 1 — Strict shadcn Adoption Plan (Audit + Migration Checklist)

## Scope
This document covers **Task 1 only** for `nutri-mvp`: audit current UI usage and define a migration checklist to use **actual shadcn/ui components and patterns** consistently.

---

## 1) Current UI Audit (what is not strict shadcn yet)

### A. Foundational setup
- `components.json` exists and points to shadcn aliases ✅
- Tailwind tokens in `app/globals.css` exist ✅
- `cn()` utility exists in `lib/utils.ts` ✅

### B. Existing UI components
Current files in `components/ui`:
- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `input.tsx`
- `label.tsx`

These are **custom/minimal implementations inspired by shadcn**, but not strict canonical shadcn generated set:
- `Dialog` lacks canonical close button (`DialogClose` + icon), animations, and helper slots (`DialogDescription`, footer patterns).
- `Button` variants/sizes are reduced (missing standard variant matrix and focus-visible defaults commonly used in shadcn templates).
- `Input` and `Label` are simplified and missing richer accessibility/focus classes from canonical templates.
- No shadcn registry verification history (re-add/update via `npx shadcn@latest add ...`) is documented.

### C. UI surfaces in `components/tracker-page.tsx` not using strict shadcn patterns
1. **View switcher (Today/Week/Month)**
   - Currently 3 plain `Button`s.
   - Should be `Tabs` (or `ToggleGroup`) for semantic segmented view selection.

2. **Meal form fields inside dialog**
   - `Meal type` uses free-text `Input`; should be controlled `Select`.
   - Field rows are ad-hoc `<div className="grid gap-1">`; should use consistent `Form` layout primitives/pattern.
   - `Notes` uses single-line `Input`; should be `Textarea`.

3. **Summary metrics block**
   - Plain `<p>` list in `CardContent`; should use shadcn-friendly composition (`Card` sections + `Separator`/grid items + typographic hierarchy).

4. **Meals list items**
   - Each item is a plain bordered `<div>`.
   - Should be standardized with `Card`/`List` pattern + `Badge` for meal type + optional `DropdownMenu`/`AlertDialog` for destructive delete.

5. **Date control**
   - Plain `<Input type="date">` is functional but inconsistent with shadcn UX.
   - Should migrate to `Popover + Calendar` (Date Picker pattern) if strict adoption is required.

6. **Danger action (Delete)**
   - Direct `Button` click deletes immediately.
   - Should use `AlertDialog` confirmation for destructive action.

---

## 2) Migration Checklist (P0/P1)

## P0 (must do for strict adoption in this task)

1. **Reconcile UI primitives with canonical shadcn**
   - Re-add/refresh core components via shadcn CLI:
     - `button`, `input`, `label`, `card`, `dialog`
   - Ensure generated code matches current shadcn conventions (focus-visible, disabled, data-state classes, slot structure).

2. **Replace view mode buttons with semantic selector**
   - Preferred: `Tabs` with values `day | week | month`.
   - Alternative: `ToggleGroup` (single selection).

3. **Convert meal form to strict shadcn field composition**
   - Add/use: `Select` for `mealType`.
   - Add/use: `Textarea` for `notes`.
   - Normalize field wrappers and label/control spacing using consistent form layout pattern.

4. **Protect destructive action**
   - Add/use `AlertDialog` for delete confirmation before API call.

5. **Standardize empty/loading/error microstates with shadcn primitives**
   - Empty meals state inside a styled container (`Card` section + muted text).
   - (If loading is added) use `Skeleton` placeholders for summary/list blocks.

## P1 (next pass, still part of strictness roadmap)

1. **Date picker UX upgrade**
   - Replace native date input with shadcn Date Picker pattern (`Popover + Calendar`).

2. **List visual semantics**
   - Add `Badge` for meal type; optional `Separator` between list rows.
   - Optional `DropdownMenu` actions per meal (Edit/Delete future-proofing).

3. **Mobile-first action ergonomics**
   - Consider `Sheet` for add/edit meal on small screens, keep `Dialog` on desktop.

4. **Accessibility hardening**
   - Ensure `DialogDescription`, aria labels for icon-only actions, keyboard-visible focus states across interactive components.

5. **Toast feedback loop**
   - Add shadcn `Sonner`/`Toast` pattern for add/delete success/error feedback.

---

## 3) Component-by-surface target map

- Header view control → `Tabs`
- Add meal trigger/modal → `Dialog` (canonical)
- Meal type field → `Select`
- Notes field → `Textarea`
- Delete action → `AlertDialog`
- Summary details structure → `Card` + `Separator`/grid typography
- Meals list item meta → `Badge` (+ optional `DropdownMenu`)
- Date selector (future) → `Popover` + `Calendar`

---

## 4) Definition of Done for Task 1 (audit/design only)
- All non-strict surfaces are identified (above).
- P0/P1 migration list is explicit and actionable.
- Theme/token decisions are documented separately in `docs/TASK1_THEME_DECISIONS.md`.
- No code-heavy refactor included in this task by design.
