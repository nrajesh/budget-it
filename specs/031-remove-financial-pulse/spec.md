# Specification: Remove Financial Pulse & Reposition Ledger Settings

## Problem Statement
The "Financial Pulse" dashboard style is no longer desired. Additionally, the layout of the settings page could be optimized by moving the "Ledger Settings" into the main settings grid and removing the "Dashboard Style" setting altogether.

## Goals
- Remove "Financial Pulse" as a dashboard style option.
- Remove the "Dashboard Style" setting card from the Settings page.
- Move the "Ledger Settings" card into the grid slot previously occupied by "Dashboard Style".
- Ensure the application defaults to the "Standard" dashboard style.

## Functional Requirements
1.  **Dashboard Style Removal**:
    -   Remove "Financial Pulse" from `DashboardStyle` type definition.
    -   Ensure `ThemeContext` defaults to "standard" and no longer supports "financial-pulse".
2.  **Settings Page Layout Update**:
    -   Remove the "Dashboard Style" card.
    -   Move "Ledger Settings" from its top-level position into the grid, between "Default Currency" and "Future Transactions".
3.  **UI Consistency**:
    -   Verify that "Ledger Settings" fits well within the 1/3 column grid on desktop.
    -   Ensure buttons in "Ledger Settings" are responsive.

## Non-Goals
- Complete removal of code blocks related to "Financial Pulse" (conditional rendering in charts, etc.) unless they cause build errors. The primary goal is UI removal and layout repositioning.
