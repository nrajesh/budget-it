# Implementation Plan - Insights UI Consistency

This plan outlines the changes required to align the Insights page UI with the Analytics and Transactions pages.

## User Review Required
None.

## Proposed Changes

### UI Components

#### [MODIFY] [Insights.tsx](file:///Users/nrajesh/Github/budget-it/src/pages/Insights.tsx)
-   **Header**: Replace the simple `h1` with the gradient-styled header from `Analytics.tsx`.
-   **Container**: Update the main wrapper `div` to include the standard background, padding, and rounded corners found in other pages.
-   **Usage Trends**: Wrap the "Top Account Activity" and "Top Vendor Spending" sections in `Card` components or the standard bordered container used in `Transactions` table to ensure visual consistency and better separation.

## Verification Plan

### Automated Tests
-   Run `pnpm type-check` to ensure no type errors.
-   Run `pnpm lint` to ensure code style consistency.
-   Run `pnpm build` to verify the build passes.

### Manual Verification
-   Open the application (or browser at localhost).
-   Navigate to generic pages to compare:
    -   Analytics
    -   Transactions
    -   Insights
-   Verify that:
    -   The background color and corner radius of the main container are identical.
    -   The header font size, weight, and gradient are identical.
    -   The section spacing and borders feel consistent.
