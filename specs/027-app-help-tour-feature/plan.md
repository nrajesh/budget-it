# Implementation Plan - App Help Tour Module

This plan outlines the integration of a guided help tour using `react-joyride` to assist users in navigating the `budget-it` application.

## User Review Required

> [!IMPORTANT]
> - **Library Selection**: Installing `react-joyride` as the primary engine for tours.
> - **Entry Point**: A new `HelpIcon` (Question Mark) will be added to the `Header.tsx` component, visible from the `/ledgers` screen onwards.
> - **Auto-start**: Tours will **not** auto-start; they must be triggered by clicking the help icon.

## Proposed Changes

### Core Integration

#### [NEW] [TourContext.tsx](file:///Users/nrajesh/Github/budget-it/src/contexts/TourContext.tsx)
- Create a context to manage the active state of the tour and provide a function to start/stop it.
- Store step configurations for different routes.

#### [NEW] [help-tour.tsx](file:///Users/nrajesh/Github/budget-it/src/components/ui/help-tour.tsx)
- Implementation of the `Joyride` component wrapper.
- Handles theme styling (matching current light/dark mode).
- Maps high-level step definitions to `react-joyride` format.

#### [NEW] [tourSteps.ts](file:///Users/nrajesh/Github/budget-it/src/constants/tourSteps.ts)
- Centralized configuration for all tour steps across different screens (Ledger Entry, Dashboard, Transactions, etc.).
- This makes it easy to update tours as requested.

### UI Components

#### [MODIFY] [Header.tsx](file:///Users/nrajesh/Github/budget-it/src/components/layout/Header.tsx)
- Add the `HelpCircle` icon from `lucide-react`.
- Conditionally show the icon if the user is not on the root landing page (or specifically from `/ledgers` onwards).
- Hook up the icon to the `TourContext` to trigger the tour.

### Application Level

#### [MODIFY] [App.tsx](file:///Users/nrajesh/Github/budget-it/src/App.tsx)
- Wrap the application (or the `Layout` routes) with `TourProvider`.
- Include the `<HelpTour />` component at a high level so it can overlay any screen.

---

## Verification Plan

### Automated Tests
- **Lint & Type Check**: `pnpm lint` and `pnpm exec tsc --noEmit` to ensure no regressions.
- **Build**: `pnpm build` to verify the new dependency and code don't break the production bundle.

### Manual Verification
1. **Desktop Tour**:
   - Navigate to `/ledgers`.
   - Click the help icon.
   - Verify that the tour starts and correctly highlights elements.
   - Progress through all steps and verify they finish correctly.
2. **Theme Support**:
   - Start the tour in Light mode.
   - Toggle to Dark mode.
   - Verify the tour tooltip colors and overlay adapt correctly.
3. **Mobile Browser/App**:
   - Open the app in a mobile viewport (375px).
   - Verify the help icon is reachable (likely in the top-right header, alongside the mobile menu trigger).
   - Start the tour and verify tooltips are readable and don't overflow the screen.
4. **Navigation**:
   - Start tour on `/ledgers`.
   - Finish it.
   - Navigate to `/dashboard` (index).
   - Click help icon and verify a *different* set of steps (specific to dashboard) is shown.
