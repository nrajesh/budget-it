# Implementation Plan: Dashboard

**Branch**: `main`
**Spec**: [spec.md](./spec.md)

## Technical Context

**Components**:
- `FinancialPulseDashboard`: Main container.
- `ConsolidatedMetricsCard`: Assets/Debts/Net Worth.
- `RunwayCard`: Burn rate calculation.
- `BudgetStatusCard`: Budget progress.
- `RecentActivityFeed`: Transaction list.

**Data Source**:
- `useTransactions`: Fetches all transactions to compute metrics client-side.
- `useBudgets`: Fetches budgets.
- **Performance**: Client-side aggregation might lag with large datasets.

## Project Structure

### Source Code Impact

```text
src/
├── components/
│   └── dashboard/
│       ├── FinancialPulseDashboard.tsx
│       ├── ConsolidatedMetricsCard.tsx
│       ├── RunwayCard.tsx
│       ├── BudgetStatusCard.tsx
│       └── RecentActivityFeed.tsx
```

## Implementation Strategy

### Metrics Calculation
- **Net Worth**: Sum of all Account Balances (Assets - Debts).
- **Runway**: Total Liquid Assets / Average Monthly Expense (last 3 months).
- **Pulse Score**: Heuristic based on Savings Rate, Debt-to-Income, etc.

### Visualization
- Uses `recharts` for charts (e.g. `StackedCategoryChart`).
