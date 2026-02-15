# Implementation Plan: Reports & Analytics

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**Components**:
- `ReportsDashboard`: Main container.
- `CategoryBreakdown`: Pie/Bar charts.
- `CashFlowChart`: Bar chart for Income/Expense.
- `SpendingTrends`: Line chart.

**Libraries**: `recharts` for visualization.

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── reports/
│       ├── ReportsDashboard.tsx
│       ├── CategoryBreakdown.tsx
│       ├── CashFlowChart.tsx
│       └── SpendingTrends.tsx
```

## Implementation Strategy

### Client-Side Aggregation
- Reports fetch ALL transactions for the active ledger.
- Filtering and aggregation happens in functional components or custom hooks (e.g. `useReportData`).
- **Optimization**: Memoize aggregations (`useMemo`) to prevent re-calc on UI renders.
