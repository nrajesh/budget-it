# Walkthrough — Analytics Module Reimagine (013)

**Branch**: `013-analytics-mobile-reimagine` → merged to `pre-prod`  
**Date**: 2026-03-03  
**Status**: ✅ Deployed to remote `pre-prod`

---

## What Was Built

The Analytics page was completely reimagined for mobile-first use. Nine new components and two new hooks were introduced, replacing the old monolithic chart views.

### New Components

| File | Purpose |
|------|---------|
| `AnalyticsChartView.tsx` | Top-level container — chart type toggles, swipe nav, period selector, table |
| `SpendingLineChart.tsx` | Line chart with current vs previous period, green/red delta markers |
| `SpendingBarChart.tsx` | Bar chart with avg/max/mean dotted lines, dark-mode-aware labels |
| `SpendingPieChart.tsx` | Pie chart with focus mode, center display, gray-out, and reset |
| `SpendingSummaryHeader.tsx` | Header showing total spent + delta vs previous period |
| `PeriodSelector.tsx` | 1W / 1M / 6M / 1Y + custom date range picker |
| `EntityBreakdownTable.tsx` | 3-level drill-down table: categories → sub-categories → transactions |

### New Hooks

| File | Purpose |
|------|---------|
| `useAnalyticsPeriod.ts` | Period management, current vs previous window computation, navigation |
| `useSwipeNavigation.ts` | Touch swipe + keyboard arrow period navigation |

---

## Pie Chart — Focus Mode

When clicking a pie segment:
- **Selected segment** stays coloured at full opacity
- **All other segments** fade to gray (`opacity: 0.35`, zinc-700 / zinc-300 per theme)
- **Center** shows: category name (dynamic font size) + amount + period label
- **Reset options**: click the center area **or** click the already-selected segment

```
PIE_COLORS   = 10 vivid colors (indigo, pink, green, amber, cyan, violet, red, teal, orange, blue)
GRAY_COLOR   = #3f3f46 (zinc-700) in dark mode
             = #d4d4d8 (zinc-300) in light mode
```

Dark mode detection uses `useTheme` from `next-themes` (respects user toggle).

---

## Table — Three-Level Drill-Down

```
Level 1  By Category ▾         (default — all categories; clicking syncs pie chart)
         └─ Level 2  Housing   (sub-categories of selected category)
                └─ Level 3  Rent · Mar 1 · € 1,200   (individual transactions)
```

Navigation controls:
- **‹ back** button — goes one level up
- **Clear** button (top-right) — resets to Level 1 and deselects pie
- **Breadcrumb** row (`All › Housing › Rent`) — click any node to jump to it
- Table row chevron (›) indicates the row is clickable

---

## Dark Mode

All chart axes, labels, and legends use `fill: white` / `stroke: white` in dark mode.  
Pie category labels have a contrasted fill, readable on any background.

---

## Period Selector

- Pills: **1W · 1M · 6M · 1Y** with active highlight
- **Custom** (`...`) opens a `react-day-picker` v9 range calendar
- Calendar layout fix: weekday headers were jumbled — corrected via `formatters` prop

---

## Swipe / Keyboard Navigation

- **Swipe right** → previous period, **swipe left** → next period (≥ 50px threshold)
- **← → chevrons** on desktop (disabled and 30% opacity at history boundary)
- Navigation guard prevents going past the earliest/latest available data

---

## What Was Tested

- ✅ `pnpm exec tsc --noEmit` — 0 type errors
- ✅ `pnpm lint` — 0 errors (29 pre-existing warnings only, unrelated to analytics)
- ✅ `pnpm build` — clean production build in 12.58 s
- ✅ Verified visual states in browser (dark & light mode)
- ✅ Pie click → category filter → sub-category list → transaction list end-to-end
- ✅ Pie reset via center click and segment re-click
- ✅ Period navigation backwards and forwards

---

## Files Changed

```
M  src/pages/Analytics.tsx
M  tailwind.config.ts                   (pie-center-glow animation)
M  src/components/ui/calendar.tsx       (react-day-picker v9 compat)

A  src/components/charts/AnalyticsChartView.tsx
A  src/components/charts/SpendingLineChart.tsx
A  src/components/charts/SpendingBarChart.tsx
A  src/components/charts/SpendingPieChart.tsx
A  src/components/charts/SpendingSummaryHeader.tsx
A  src/components/charts/PeriodSelector.tsx
A  src/components/charts/EntityBreakdownTable.tsx
A  src/hooks/useAnalyticsPeriod.ts
A  src/hooks/useSwipeNavigation.ts
A  specs/013-analytics-mobile-reimagine/spec.md
A  specs/013-analytics-mobile-reimagine/plan.md
```
