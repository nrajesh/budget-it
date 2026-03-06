# Implementation Tasks: App Help Tour Module

## Phase 1: Setup & Dependencies
- [ ] Task 1.1: Install `react-joyride` dependency.
- [ ] Task 1.2: Install type definitions if required (`@types/react-joyride`).

## Phase 2: Core Implementation
- [ ] Task 2.1: Create `src/constants/tourSteps.ts` with initial step definitions for `/ledgers` and `/transactions`.
- [ ] Task 2.2: Create `src/contexts/TourContext.tsx` to manage tour state (active status, current route steps).
- [ ] Task 2.3: Update `src/App.tsx` to wrap the app hierarchy with `TourProvider`.

## Phase 3: UI Integration
- [ ] Task 3.1: Create `src/components/ui/help-tour.tsx` that wraps `Joyride`, applies custom themes based on the app's dark/light mode, and connects to `TourContext`.
- [ ] Task 3.2: Update `src/components/layout/Header.tsx` to include the `HelpCircle` icon button, triggering the tour via `TourContext`.

## Phase 4: Refinement and Polish
- [ ] Task 4.1: Ensure tooltips in `help-tour.tsx` are responsive and mobile-friendly.
- [ ] Task 4.2: Verify that `Header.tsx` only shows the help icon on appropriate screens (e.g., hiding it on the landing directory if applicable, or ensuring it works consistently everywhere post-login).

## Phase 5: Local Verification
- [ ] Task 5.1: Run `pnpm format:check` and fix.
- [ ] Task 5.2: Run `pnpm lint` and fix.
- [ ] Task 5.3: Run `pnpm exec tsc --noEmit` and fix.
- [ ] Task 5.4: Run `pnpm build` and fix.
