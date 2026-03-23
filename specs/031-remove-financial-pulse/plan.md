# Implementation Plan: Remove Financial Pulse & Reposition Ledger Settings

## Technical Context
The "Financial Pulse" dashboard style was introduced as an alternative layout. It is being removed as part of a UI simplification. The "Ledger Settings" component is currently a full-width card above the main grid and will be moved into the grid for better space utilization.

## Proposed Changes

### [Component] Contexts
#### [MODIFY] [ThemeContext.tsx](file:///Users/nrajesh/Github/budget-it/src/contexts/ThemeContext.tsx)
-   Remove `"financial-pulse"` from `DashboardStyle` type.
-   Hardcode `isFinancialPulse` to `false`.
-   Update `setDashboardStyle` to only accept `"standard"` (to avoid runtime errors, though type-safety should handle it).
-   Update initialization logic to always default to `"standard"`.

### [Component] Pages
#### [MODIFY] [SettingsPage.tsx](file:///Users/nrajesh/Github/budget-it/src/pages/SettingsPage.tsx)
-   Remove `Dashboard Style` card (Lines 164-185).
-   Remove `handleDashboardStyleChange` function.
-   Move `Ledger Settings` card (Lines 117-135) into the grid slot previously occupied by `Dashboard Style` (between `Default Currency` and `Future Transactions`).
-   Update the `Ledger Settings` card class to handle the smaller column size (remove `tour-settings-ledger` if it's too large, or adjust its padding).

## Verification Plan

### Automated Tests
-   Run `pnpm validate` to check for TypeScript errors and lint issues.
-   Verify that all files using `isFinancialPulse` still compile (it should, as the property remains).

### Manual Verification
-   Navigate to the Settings page and verify:
    -   The `Ledger Settings` card is in the second column of the grid.
    -   The buttons ("Edit Current Ledger", "Create New Ledger") are properly aligned and not overlapping.
    -   The `Dashboard Style` setting is gone.
-   Ensure the dashboard defaults to "Standard".
