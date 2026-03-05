# Implementation Plan - Calendar UI Consistency

This plan outlines the changes to `CalendarView.tsx` and the project checklist template.

## User Review Required
None.

## Proposed Changes

### UI Components

#### [MODIFY] [CalendarView.tsx](file:///Users/nrajesh/Github/budget-it/src/pages/CalendarView.tsx)
-   **Header**: Replace `h2` with the standard `h1` gradient header.
-   **Container**: Update the main wrapper `div` to use standard page styling (slate-50/dark-gradient, rounded-xl, etc.).

### Templates

#### [MODIFY] [checklist-template.md](file:///Users/nrajesh/Github/budget-it/.specify/templates/checklist-template.md)
-   **New Section**: Add "UI Consistency" section.
-   **Items**: Add checks for "Header matches standard design" and "Container matches standard design".

## Verification Plan

### Automated Tests
-   Run `pnpm type-check` and `pnpm lint`.
-   Run `pnpm build`.

### Manual Verification
-   **Calendar UI**: Open Calendar page and visually compare with Analytics/Insights.
-   **Checklist Template**: Verify the file content includes the new section (can be tested by manually viewing the file or running the generator if applicable, but viewing is sufficient).
