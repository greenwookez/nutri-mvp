# Nutri-MVP Active Tasks

Ordered execution list (current working backlog).

## Task 1 — Strict shadcn adoption

### P0
- [x] Reconcile core UI primitives with canonical shadcn patterns
- [x] Replace view mode buttons with semantic selector (`Tabs`)
- [x] Convert meal form fields (`Select` for meal type, `Textarea` for notes)
- [x] Protect destructive delete with `AlertDialog`
- [x] Standardize empty/loading/error microstates (`Skeleton`, styled states)

### P1
- [x] Date picker UX upgrade (`Popover + Calendar`)
- [x] List visual semantics (`Badge` for meal type in rows, optional separators/menu)
- [ ] Mobile-first action ergonomics (`Sheet` on small screens)
- [ ] Accessibility hardening (`DialogDescription`, aria labels, keyboard focus checks)
- [ ] Toast feedback loop for add/delete success/error

## Next unfinished task (in order)
1. **Mobile-first action ergonomics** (`Sheet` for add-meal flow on small screens, keep `Dialog` for desktop).
