# Implementation Tasks: Remove Financial Pulse & Reposition Ledger Settings

## Phase 1: Context Cleanup
- [ ] Modify `src/contexts/ThemeContext.tsx`:
    -   Update `DashboardStyle` type.
    -   Hardcode `isFinancialPulse` to `false`.
    -   Update `ThemeProvider` to sync default style.

## Phase 2: UI Update
- [ ] Modify `src/pages/SettingsPage.tsx`:
    -   Remove `Dashboard Style` card component.
    -   Remove `handleDashboardStyleChange` handler.
    -   Relocate `Ledger Settings` card into the main grid.

## Phase 3: Validation & Cleanup
- [ ] Run `pnpm validate` to check for type errors.
- [ ] (Optional) Remove unused CSS or imports related to `financial-pulse`.
- [ ] Verify layout on mobile and desktop.

## Phase 4: Push & Deploy
- [ ] Sync assets with `npx cap sync`.
- [ ] Commit and push to `031-remove-financial-pulse`.
- [ ] Squash merge to `pre-prod`.
