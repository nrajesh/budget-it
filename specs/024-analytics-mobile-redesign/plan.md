# Implementation Plan: Reimagine Analytics Graphics for Mobile

**Branch**: `013-analytics-mobile-reimagine` | **Date**: 2026-03-03 | **Spec**: [spec.md](file:///Users/nrajesh/Github/vaulted-money/specs/013-analytics-mobile-reimagine/spec.md)

## Summary

Replace the existing two-panel analytics layout (`BalanceOverTimeChart` + `SpendingCategoriesChart`) with a unified, mobile-first analytics experience inspired by the reference screenshots. The new design features a spending summary header, three switchable chart types (line, bar, pie) with period-over-period comparison, a period selector (1W/1M/6M/1Y/custom), a toggleable entity breakdown table, and horizontal swipe navigation between periods.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Recharts 3.7, date-fns 3.6, Tailwind CSS 4, Vite 7  
**Testing**: Vitest 4, React Testing Library  
**Target Platform**: Web, Electron, Capacitor (iOS/Android)  
**Constraints**: Fully offline, local-first. No new dependencies needed - all charting via existing Recharts.

## Constitution Check

- ✅ **Privacy First**: No external data sent. All computation is client-side.
- ✅ **Local-First**: All data from IndexedDB via existing contexts.
- ✅ **Component-Driven UI**: Using Shadcn/Radix + Tailwind. ThemedCard for card wrappers.
- ✅ **Cross-Platform**: Touch swipe for mobile, keyboard/mouse for desktop/Electron.
- ✅ **No new dependencies**: Recharts, date-fns, and Tailwind already available.

## Proposed Changes

### 1. New Hooks

---

#### [NEW] [useAnalyticsPeriod.ts](file:///Users/nrajesh/Github/vaulted-money/src/hooks/useAnalyticsPeriod.ts)

Central hook managing all period logic:
- State: `period` (1W/1M/6M/1Y/custom), `periodOffset` (0 = current, -1 = previous month, etc.), `customRange`
- Computed: `currentRange: { from, to }`, `previousRange: { from, to }` (same-length period immediately before)
- Methods: `setPeriod()`, `navigateForward()`, `navigateBack()`, `setCustomRange()`
- Computes `periodLabel` (e.g., "This week", "Feb 2026", "Jan – Jun")
- Filters transactions into `currentPeriodTransactions` and `previousPeriodTransactions`

#### [NEW] [useSwipeNavigation.ts](file:///Users/nrajesh/Github/vaulted-money/src/hooks/useSwipeNavigation.ts)

Touch swipe + keyboard arrow handler:
- Takes a `ref` to the swipeable container
- Touch event listeners for swipe left/right (with minimum distance threshold)
- Keyboard listener for `ArrowLeft` / `ArrowRight`
- Calls `onSwipeLeft()` / `onSwipeRight()` callbacks
- Returns `{ containerRef, swipeHandlers }`

---

### 2. New Chart Components

---

#### [NEW] [SpendingSummaryHeader.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/SpendingSummaryHeader.tsx)

Displays at the top of the analytics view:
- "Spent" label + total amount for current period (large, bold)
- Delta from previous period: green ▼ for lower, red ▲ for higher
- Period label (e.g., "This week", "This month")
- Adapts to light/dark themes using Tailwind variables

#### [NEW] [SpendingLineChart.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/SpendingLineChart.tsx)

Cumulative spending line chart:
- Dark line (current period) + lighter line (previous period)
- Custom tooltip on click/touch showing: date, current amount, previous amount, delta with green/red color
- Uses Recharts `ComposedChart` with `Line` components
- X-axis: day labels (Mon, Tue... or 1, 6, 11...)
- Responsive height for mobile

#### [NEW] [SpendingBarChart.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/SpendingBarChart.tsx)

Average spending bar chart:
- Solid bars for per-sub-period spending amounts
- Dotted horizontal `ReferenceLine` for max and mean values
- X-axis: sub-period labels (months for 6M/1Y, weeks for 1M, days for 1W)
- Shows average per month label in header (e.g., "€ 1,734 avg. per month")

#### [NEW] [SpendingPieChart.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/SpendingPieChart.tsx)

Donut-style pie chart:
- Colorful segments for the selected entity type
- Center label shows total (e.g., "Spent € 5.202") and period range
- Click segment → highlight + filter bottom table
- Click center → reset/zoom out
- Reuses existing `ActivePieShape` component (already built)

#### [NEW] [PeriodSelector.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/PeriodSelector.tsx)

Pill-style period buttons below the chart:
- Buttons: 1W, 1M, 6M, 1Y with active state highlighting
- "..." button opens a popover with date range picker for custom dates
- Uses existing `react-day-picker` component

#### [NEW] [EntityBreakdownTable.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/EntityBreakdownTable.tsx)

Bottom table with entity toggle:
- Header: "By Category ▾" (dropdown to toggle: Category, Vendor, Currency, Account)
- Each row: entity icon/emoji, name, transaction count, amount, percentage
- Category view includes sub-category drilldown capability
- "Manage" link retained from reference

#### [NEW] [AnalyticsChartView.tsx](file:///Users/nrajesh/Github/vaulted-money/src/components/charts/AnalyticsChartView.tsx)

Container component orchestrating the full analytics view:
- Chart type toggles (line/bar/pie icons at top-right, matching reference)
- Swipeable wrapper using `useSwipeNavigation`
- Renders the active chart type
- Renders `PeriodSelector` below the chart
- Renders `EntityBreakdownTable` below the period selector
- Desktop: left/right chevron overlays for period navigation

---

### 3. Modified Page

---

#### [MODIFY] [Analytics.tsx](file:///Users/nrajesh/Github/vaulted-money/src/pages/Analytics.tsx)

Replace the existing two-panel grid layout with the new `AnalyticsChartView`:
- Remove the `SearchFilterBar` (analytics is now self-contained with its own period selector and entity toggle)
- Remove the `BalanceOverTimeChart` + `SpendingCategoriesChart` grid
- Add `SpendingSummaryHeader` + `AnalyticsChartView`
- Pass transactions and context data to the new components
- Keep the `RecentTransactions` component at the bottom but wire it to entity filtering

---

### 4. Existing Components - No Deletion

The existing `BalanceOverTimeChart.tsx`, `SpendingCategoriesChart.tsx`, and `CategoryPieChart.tsx` will **not be deleted** as they may be used on other pages (dashboard, reports). The Analytics page will simply stop importing them.

## Data Flow Architecture

```
Analytics.tsx
  ├── useAnalyticsPeriod(transactions) → currentPeriod, previousPeriod, periodLabel
  ├── SpendingSummaryHeader(totalSpent, delta, periodLabel)
  └── AnalyticsChartView
        ├── useSwipeNavigation → navigateBack/Forward
        ├── Chart Type Toggle (line | bar | pie)
        ├── SpendingLineChart(currentData, previousData) - or -
        │   SpendingBarChart(currentData) - or -
        │   SpendingPieChart(currentData, entityType)
        ├── PeriodSelector(period, setPeriod)
        └── EntityBreakdownTable(transactions, entityType)
```

## Verification Plan

### Automated Tests

1. **`useAnalyticsPeriod` hook unit test** (`src/tests/useAnalyticsPeriod.test.ts`):
   - Verify correct date ranges for each period (1W, 1M, 6M, 1Y)
   - Verify previous period calculation
   - Verify `navigateForward` / `navigateBack` shift the offset correctly
   - Verify custom date range handling
   - **Run**: `pnpm exec vitest run src/tests/useAnalyticsPeriod.test.ts`

2. **`useSwipeNavigation` hook unit test** (`src/tests/useSwipeNavigation.test.ts`):
   - Verify touch event detection (swipe left/right with threshold)
   - Verify keyboard arrow key handling
   - **Run**: `pnpm exec vitest run src/tests/useSwipeNavigation.test.ts`

3. **Existing `ChartSecurity.test.tsx`** - verify it still passes (no regressions):
   - **Run**: `pnpm exec vitest run src/tests/ChartSecurity.test.tsx`

### Build Verification

- **Format**: `pnpm format:check`
- **Lint**: `pnpm lint`
- **Type Check**: `pnpm exec tsc --noEmit`
- **Build**: `pnpm build`

### Manual Verification (User)

1. Open the app, navigate to Analytics page
2. Verify the spending summary header shows correct total and delta
3. Toggle between line, bar, and pie chart types
4. On line chart: tap a data point and verify the comparison tooltip
5. On bar chart: verify dotted lines for max/mean
6. On pie chart: tap a segment, verify table filters; tap center to reset
7. Use period selector (1W, 1M, 6M, 1Y) and verify data updates
8. Tap "..." and enter custom dates
9. Swipe left/right on mobile or use arrow keys on desktop
10. Toggle "By Category" dropdown between Category, Vendor, Currency, Account
11. Verify light and dark modes render correctly
12. Test on a 375px mobile viewport
