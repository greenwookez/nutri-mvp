# UI Handoff — shadcn/Base UI direction (Tony)

## What changed in this pass

1. **Header cleanup**
   - Removed tiny left brand label (`Nutri MVP`).
   - Kept only title: **Nutrition Today**.
   - Removed time input from header controls.

2. **Meal entry moved to modal**
   - Removed inline **Add meal entry** card from Today layout.
   - `+ Add meal` now opens a dialog (`<dialog id="addMealModal">`).
   - All entry fields are inside the dialog (including **Date** + **Time**).

3. **Dialog UX**
   - Trigger: `#openAddMealModal`.
   - Close actions:
     - top-right close icon (`#closeAddMealModal`)
     - secondary action **Cancel** (`#cancelAddMealModal`)
     - backdrop click
   - Primary action: **Save meal** (submit).
   - After save:
     - modal closes
     - selected header date syncs to saved meal date
     - summaries refresh

---

## Compact color/theme spec (shadcn-inspired dark)

Token intent added to CSS root:

- `--background`: app canvas
- `--card`: default card/dialog surfaces
- `--popover`: elevated controls/inputs
- `--muted`: subdued interactive background
- `--foreground`, `--secondary-foreground`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--border`, `--ring`

Mapped to existing app vars for backward compatibility:

- `--bg-page <- --background`
- `--bg-surface <- --card`
- `--bg-elevated <- --popover`
- `--bg-subtle <- --muted`
- `--text-primary <- --foreground`

This keeps existing components stable while shifting toward shadcn/Base UI naming semantics.

---

## Class/token additions to know

### New / active layout classes
- `.modal-root`, `.modal-card`, `.modal-head`, `.modal-actions`, `.modal-close`
- `.field-group`, `.field-span-2`

### Removed from active layout
- `.eyebrow` usage in header
- `.time-field` usage in header
- inline add-meal card in Today section

### Mobile behavior
- `+ Add meal` stays visible in tab bar on mobile (no hide rule).
- Dialog actions stack vertically on small screens.

---

## Notes for next UI pass

- If we move to full shadcn tokens later, we can progressively replace legacy aliases (`--bg-*`, `--text-*`) component-by-component.
- Consider a shared "form row" primitive for labels + controls to align with Base UI patterns.
- Optional: add keyboard `Esc` helper text in dialog footer for extra clarity.
