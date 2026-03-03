# Task 1 — Theme Decisions (shadcn token system)

## Goal
Define a consistent visual/token direction for strict shadcn adoption in Nutri MVP.

---

## 1) Design direction
- **Style:** clean health-tracker UI, low visual noise, high scanability.
- **Brand feeling:** calm + reliable + data-first.
- **Primary hue direction:** green-centric (already aligned with nutrition/health intent).

---

## 2) Token policy (must stay token-first)

1. **No raw hex in components**
   - Use semantic tokens only (`bg-background`, `text-foreground`, `border-border`, etc.).

2. **Single source of truth**
   - HSL CSS variables in `app/globals.css`.
   - Tailwind `extend.colors` maps only to variables.

3. **Component styling rule**
   - UI primitives define interaction/focus/shape.
   - Product screens compose primitives; avoid ad-hoc per-screen color overrides.

---

## 3) Approved semantic tokens

## Core surfaces
- `--background`: app canvas
- `--foreground`: primary text
- `--card`, `--card-foreground`: elevated containers
- `--border`, `--input`, `--ring`: outlines, controls, focus ring

## Functional emphasis
- `--primary`, `--primary-foreground`: main CTA, selected tab/value
- `--secondary`, `--secondary-foreground`: neutral controls
- `--muted`, `--muted-foreground`: helper/metadata text
- `--accent`, `--accent-foreground`: hover/soft emphasis

> Decision: keep existing green primary family and enforce consistent use rather than introducing additional brand colors in Task 1.

---

## 4) Interaction tokens/behavior standards
- **Focus:** every interactive control must show `focus-visible:ring-2 ring-ring ring-offset-2` behavior from canonical shadcn components.
- **Radius scale:**
  - Inputs/buttons/chips: `rounded-md`
  - Containers/cards/dialogs: `rounded-lg` to `rounded-xl` (component default)
- **Shadow policy:** subtle only (`shadow-sm` baseline), avoid heavy custom shadows.
- **State semantics:**
  - Destructive actions use shadcn destructive variant and/or `AlertDialog` confirm flow.

---

## 5) Typography and spacing decisions
- Typography stays system/default stack for now (no custom font introduction in Task 1).
- Use shadcn sizing rhythm:
  - Page title: `text-2xl font-bold`
  - Section title: `text-base/large + semibold`
  - Metadata: `text-sm text-muted-foreground`
- Spacing rhythm:
  - Vertical block gaps: `gap-4` / `gap-6`
  - Form rows: `gap-2` or `gap-3`
  - Card padding defaults from shadcn (`p-6`, content rules)

---

## 6) Dark mode policy
- `darkMode: ["class"]` is already enabled.
- Task 1 requirement: keep token parity so components remain readable in both themes.
- Do not add hardcoded light-only styles in feature components.

---

## 7) Component-level mapping to tokens
- Primary CTA (`Add meal`, `Save`) → `variant="default"` (`primary` token)
- Secondary controls (`Week`, `Month`, non-selected tabs) → `secondary/outline` variants
- Metadata (`date/time/meal type lines`) → `muted-foreground`
- Inputs/select/textarea borders → `input` + `ring` for focus
- Summary/meal containers → `card` + `border`

---

## 8) Out-of-scope for Task 1
- New brand palette exploration
- Advanced charts/visualization color system
- Animated theming or custom design language beyond shadcn semantics

This keeps Task 1 focused on strict adoption + consistency, not broad redesign.
