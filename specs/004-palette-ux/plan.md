# Technical Plan: Add aria-labels to Icon-Only Buttons

## Technical Context

The codebase uses shadcn/ui `<Button>` components with `size="icon"` for action buttons (edit, delete, navigation). Many of these lack accessible names. Two files already demonstrate the correct pattern:
- `Layout.tsx`: Uses `<span className="sr-only">` inside the button
- `TransactionActions.tsx`: Uses `<span className="sr-only">` inside the button

For this change, we'll use `aria-label` directly on the `<Button>` element — it's the simplest approach and consistent with how the `Checkbox` components in the same files are already labelled.

## Proposed Changes

### Budget Components

#### [MODIFY] [BudgetCard.tsx](file:///Users/nrajesh/Github/budget-it/src/components/budgets/BudgetCard.tsx)
- Add `aria-label="Edit budget"` to 2 edit icon buttons (lines 233, 401–405)
- Add `aria-label="Delete budget"` to 2 delete icon buttons (lines 236–241, 409–412)

#### [MODIFY] [BudgetsTable.tsx](file:///Users/nrajesh/Github/budget-it/src/components/budgets/BudgetsTable.tsx)
- Add `aria-label="Edit budget"` to edit icon button (line 237–242)
- Add `aria-label="Delete budget"` to delete icon button (line 244–249)

---

### Calendar Component

#### [MODIFY] [CalendarGrid.tsx](file:///Users/nrajesh/Github/budget-it/src/components/dashboard/calendar/CalendarGrid.tsx)
- Add `aria-label="Previous month"` to prev-month button (line 108)
- Add `aria-label="Next month"` to next-month button (line 111)

---

### Entity Management Components

#### [MODIFY] [EntityTable.tsx](file:///Users/nrajesh/Github/budget-it/src/components/management/EntityTable.tsx)
- Add `aria-label="Edit"` to edit icon button (line 163–169)
- Add `aria-label="Delete"` to delete icon button (line 171–178)

#### [MODIFY] [GroupedEntityTable.tsx](file:///Users/nrajesh/Github/budget-it/src/components/management/GroupedEntityTable.tsx)
- Add `aria-label="Edit"` to edit icon button (line 252–258)
- Add `aria-label="Delete"` to delete icon button (line 260–266)

---

### Sub-Categories Dialog

#### [MODIFY] [ManageSubCategoriesDialog.tsx](file:///Users/nrajesh/Github/budget-it/src/components/categories/ManageSubCategoriesDialog.tsx)
- Add `aria-label="Save"` to save icon button (line 263–271)
- Add `aria-label="Cancel"` to cancel icon button (line 272–280)
- Add `aria-label="Edit sub-category"` to edit icon button (line 284–292)
- Add `aria-label="Delete sub-category"` to delete icon button (line 293–301)

---

### Currency Management

#### [MODIFY] [CurrencyManagement.tsx](file:///Users/nrajesh/Github/budget-it/src/components/management/CurrencyManagement.tsx)
- Add `aria-label="Remove currency"` to delete icon button (line 431–438)

---

### Backup Component

#### [MODIFY] [ScheduledBackups.tsx](file:///Users/nrajesh/Github/budget-it/src/components/backup/ScheduledBackups.tsx)
- Add `aria-label="Verify permission"` to shield icon button (line 541–549) — already has `title`, add `aria-label` for screen readers
- Add `aria-label="Delete schedule"` to delete icon button (line 551–558) — already has `title`, add `aria-label` for screen readers

## Verification Plan

### Automated Tests
1. **Lint**: `pnpm lint` — ensure no ESLint errors
2. **Type check**: `pnpm exec tsc --noEmit` — ensure no TypeScript errors
3. **Build**: `pnpm build` — ensure production build succeeds

### Manual Verification
- Verify no visual changes by launching the app with `pnpm dev` and checking budget cards, calendar, entity tables, and backup pages
