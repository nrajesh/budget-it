# Feature Specification: Reimagine Analytics Graphics for Mobile

**Feature Branch**: `013-analytics-mobile-reimagine`  
**Created**: 2026-03-03  
**Status**: ✅ Complete  
**Input**: User description: "Reimagine the analytics graphics esp. the 'Balance Over Time' and 'Spending by Category' graphs to be more intuitive for mobile devices using attached references."  
**Completed**: 2026-03-03

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Three-Graph Analytics View with Period Comparison (Priority: P1)

The user opens the Analytics page and sees three swipable graph types (line, bar, pie) displayed one at a time via icon toggles at the top. Each graph compares the **current period** to the **previous period** of the same duration when data exists.

- **Line graph**: Dark line = current period, lighter line = previous period. Pressing a data point shows a tooltip comparing that day's spending vs. the same day in the previous period. Change is displayed as a green (↓ lower spending) or red (▲ higher spending) delta marker.
- **Bar graph**: Solid bars show the average spending values per sub-period. Dotted horizontal lines mark **max** and **mean** values for the period.
- **Pie chart**: Colorful segments representing only the selected entity (category by default). Clicking a segment highlights it (all other segments gray out) and filters the bottom transaction table to that category. Clicking the already-selected segment **or the center** resets/zooms out.

**Why this priority**: This is the core analytics experience - the user must see and switch between chart types easily.

**Independent Test**: Can be fully tested by navigating to Analytics, toggling between the three chart types, and verifying each renders correctly with appropriate data.

**Acceptance Scenarios**:

1. **Given** user has transactions for the current and previous periods, **When** they view the line chart, **Then** they see a dark line for the current period and a lighter line for the previous period, with green/red delta markers.
2. **Given** user is on the bar chart, **When** they view it, **Then** they see solid bars for average values and dotted lines for max and mean.
3. **Given** user clicks a pie chart segment, **When** a category is selected, **Then** the bottom table filters to show only transactions from that category. Clicking center resets the filter.

---

### User Story 2 - Period Selector (1W, 1M, 6M, 1Y, Custom) (Priority: P1)

Below the x-axis of any chart, the user sees period buttons: **1W**, **1M**, **6M**, **1Y**. These are clearly visible pill-style buttons. Next to **1Y** is a **"…"** button that opens a date picker for custom start and end dates. Selecting a period recalculates all charts, the summary header, and the bottom table.

**Why this priority**: Period selection is fundamental - all data and comparisons depend on it.

**Independent Test**: Tap each period button and verify the chart redraws with correct date-filtered data. Tap "…" and enter custom dates.

**Acceptance Scenarios**:

1. **Given** user is on Analytics, **When** they tap "1W", **Then** charts show the last 7 days vs. the equivalent 7 days before.
2. **Given** user taps "…", **When** they enter a custom date range, **Then** charts update to reflect the custom range and comparison is the same-length period immediately before.

---

### User Story 3 - Interactive Line Chart Tooltip with Period Comparison (Priority: P1)

When the user touches/clicks on a data point on the line chart, a tooltip appears showing:
- The date label (e.g., "Today" or "Mon")
- Current period amount (e.g., € 5,81)
- Previous period amount on the corresponding day (e.g., € 28)
- Delta indicator: green ▼ if spending decreased, red ▲ if spending increased, with the difference amount.

**Why this priority**: This is the primary way users compare spending at a glance - the reference screenshots heavily emphasize this interaction.

**Independent Test**: Touch/click data points on the line chart and verify the tooltip displays correct comparison data.

**Acceptance Scenarios**:

1. **Given** user is on the line chart for "1W", **When** they tap Monday's data point, **Then** a tooltip shows current vs. previous week Monday spending with a green/red delta.
2. **Given** there is no previous period data, **When** user taps a data point, **Then** the tooltip shows only the current period's value without a delta.

---

### User Story 4 - Entity Toggle for Bottom Table with Three-Level Drill-Down (Priority: P2)

Below the charts, the user sees a section header like "By Category ▾". Tapping this dropdown toggles the bottom table view between: **Category** (includes sub-categories when drilled), **Vendor**, **Currency**, and **Account**. Each row shows the entity name, transaction count, the contributing amount, and the percentage of total for the selected period.

When the **category** entity type is active and a category is selected (either via pie click or table row click):
- Level 1: **Category list** - clicking a row selects it and syncs the pie chart
- Level 2: **Sub-category list** - clicking a sub-category drills into transactions
- Level 3: **Transaction list** - shows vendor, date, amount for individual transactions

A **breadcrumb** (`All › Housing › Coffee`) and **← back** + **Clear** buttons are provided for navigation.

**Why this priority**: Allows multi-dimensional spending analysis quickly without leaving the page.

**Independent Test**: Toggle the dropdown between Category, Vendor, Currency, Account and verify the table updates correctly with appropriate data.

**Acceptance Scenarios**:

1. **Given** user taps "By Category ▾", **When** they select "Vendor", **Then** the table updates to show vendors ranked by amount with percentages.
2. **Given** user selects "Currency", **When** viewing the table, **Then** it shows spending by currency with amounts and percentages.

---

### User Story 5 - Swipeable Month Navigation (Priority: P2)

The main chart area is swipeable:
- **Swipe right** moves to the previous month (or period).
- **Swipe left** moves to the next month (or period).
- **Arrow keys (← →)** and a mouse-accessible left/right chevron control also work for desktop/keyboard users.

The header label updates to show the active period (e.g., "February 2026", "This week").

**Why this priority**: Quick temporal navigation is essential for mobile-first design - users should compare months effortlessly.

**Independent Test**: Swipe left/right on the chart area and verify the period changes. Use arrow keys on desktop.

**Acceptance Scenarios**:

1. **Given** user is viewing March 2026 data, **When** they swipe right, **Then** they see February 2026 data with all charts and table updated.
2. **Given** user is on desktop, **When** they press the left arrow key, **Then** the view shifts to the previous period.
3. **Given** user is on the earliest month with data, **When** they swipe right, **Then** nothing happens (no empty state navigation).

---

### User Story 6 - Spending Summary Header with Comparison (Priority: P2)

At the top of the analytics page, a summary header shows:
- **"Spent"** label
- **Total amount** for the current period (e.g., € 5,81)
- **Delta** from the previous period (e.g., "▼ € 22 · This week") - green if lower, red if higher
- Period label (e.g., "This week", "This month", "Jan – Jun")

**Why this priority**: Gives the user an instant glance summary before they even look at the charts.

**Independent Test**: Switch periods and verify the header recalculates total spent and delta from previous period.

**Acceptance Scenarios**:

1. **Given** user spent € 5,81 this week vs. € 28 last week, **When** viewing the header, **Then** it shows "€ 5,81" with "▼ € 22 · This week" in green.
2. **Given** user spent more this period, **When** viewing the header, **Then** the delta is shown in red with ▲.

---

### Edge Cases

- What happens when there is no previous period to compare? → Show only current period data; hide delta markers.
- What happens when there are zero transactions for a period? → Show empty state: "No spending data for this period".
- What happens when the user has transactions in multiple currencies? → Convert all to the selected currency using existing currency conversion.
- How does the pie chart handle many categories (> 8)? → Show top 7 categories and group the rest into "Other".
- What happens on very narrow screens (< 375px)? → Period buttons should wrap or scroll horizontally.
- What happens when swiping at the boundary (no earlier/later data)? → Disable swipe/show no-op feedback.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST display three chart types (line, bar, pie) switchable via icon toggles.
- **FR-002**: Line chart MUST show current period (dark) vs. previous period (light) spending over time.
- **FR-003**: Bar chart MUST show average values as solid bars with dotted lines for max and mean.
- **FR-004**: Pie chart MUST allow segment click to filter the bottom table; center click to reset.
- **FR-005**: Period selector (1W, 1M, 6M, 1Y, custom "…") MUST be visible below the chart x-axis.
- **FR-006**: Tapping a line chart data point MUST show a tooltip with current vs. previous period comparison and green/red delta.
- **FR-007**: "By Category" dropdown MUST toggle between Category, Vendor, Currency, and Account views.
- **FR-008**: Chart area MUST support horizontal swipe for month/period navigation on touch devices.
- **FR-009**: Desktop users MUST be able to navigate periods via arrow keys and on-screen chevrons.
- **FR-010**: Summary header MUST show total spent, delta from previous period, and period label.
- **FR-011**: Bottom table rows MUST show entity name, transaction count, amount, and percentage.
- **FR-012**: Pie chart segments MUST gray out (opacity 35%) when one segment is selected, making the selected segment the sole coloured element.
- **FR-013**: Clicking the pie center OR the currently-selected segment MUST reset the selection.
- **FR-014**: Table MUST support three-level drill-down for category entity type: categories → sub-categories → individual transactions.
- **FR-015**: Table MUST show a back (‹) button and a Clear button when in sub-category or transaction view.

### Standard Requirements (Budget It)
- **FR-STD-01**: Feature MUST be fully responsive and usable on mobile (375px+) and desktop.
- **FR-STD-02**: Feature MUST support both Light and Dark modes using Tailwind CSS variables.
- **FR-STD-03**: Feature MUST work offline without any network dependency.
- **FR-STD-04**: Feature MUST be compatible with Web, Electron, and Capacitor environments.
- **FR-STD-05**: All user inputs MUST be validated using Zod schemas.

### Component Impact
- **Modified Components**: `src/pages/Analytics.tsx`, `src/components/charts/BalanceOverTimeChart.tsx`, `src/components/charts/SpendingCategoriesChart.tsx`
- **New Components**: `src/components/charts/AnalyticsChartView.tsx` (container with swipe/toggle), `src/components/charts/SpendingLineChart.tsx`, `src/components/charts/SpendingBarChart.tsx`, `src/components/charts/SpendingPieChart.tsx`, `src/components/charts/PeriodSelector.tsx`, `src/components/charts/EntityBreakdownTable.tsx`, `src/components/charts/SpendingSummaryHeader.tsx`
- **New Hooks**: `src/hooks/useAnalyticsPeriod.ts` (period management, comparison data), `src/hooks/useSwipeNavigation.ts` (touch swipe + keyboard handling)
- **Context Updates**: None anticipated (uses existing `TransactionsContext` and `CurrencyContext`)

### Key Entities (Budget It Core)

- **Transaction**: The central data unit. Used to calculate spending totals, averages, and breakdowns.
- **Account**: Source of funds. Used as an entity toggle in the bottom table.
- **Vendor**: Merchant/payee. Used as an entity toggle in the bottom table.
- **Category**: Hierarchical classification. Default entity view with sub-category drilldown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch between line, bar, and pie charts with one tap.
- **SC-002**: Period comparison (current vs. previous) is visible at a glance on all chart types.
- **SC-003**: Users can navigate between months by swiping in under 0.5 seconds.
- **SC-004**: The bottom table updates instantly when toggling entity type (Category, Vendor, Currency, Account).
- **SC-005**: All charts render correctly on screens 375px wide and above.
- **SC-006**: Green/red delta indicators accurately reflect spending changes vs. previous period.
